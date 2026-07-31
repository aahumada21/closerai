# Guia de configuracion por numero (agente)

Fecha: 2026-06-20

## Objetivo

Esta guia es para cuando se construya una pagina/panel de administracion que permita
configurar cada numero (telefono de WhatsApp, o canal webchat) de forma independiente:
horarios, precios, cobertura, calendario, servicios. Todos los numeros de esta linea
de negocio (detailing / lavado de autos) comparten el mismo flujo de n8n; lo que cambia
por numero es **solo la configuracion en la base de datos**, nunca el codigo de los
workflows.

**Actualizacion 2026-06-22:** ya existe un endpoint de onboarding que automatiza la
creacion del agente base (paso "Modelo de datos" mas abajo, sin `agent_staff` ni
`agent_channels`, que se configuran despues a mano o vía un endpoint futuro). Ver
`docs/ONBOARDING_API_2026-06-22.md` para el contrato exacto. El resto de esta guia
(horarios, cobertura, staff, calendario, precios) sigue siendo edicion manual de
`agent_business_config`/`agent_staff`/`pricing_versions` tal como se describe abajo —
el endpoint de onboarding solo deja al agente con valores genericos de partida para
que se terminen de ajustar desde el panel.

## Modelo de datos (orden de creacion)

```
organizations
  └─ agents                (1 agente = 1 numero/linea de atencion)
       ├─ agent_channels        (numero/widget -> agente)
       ├─ agent_business_config (horarios, cobertura, servicios, calendario, duracion)
       ├─ agent_staff            (opcional: personas con calendario/horario propio)
       └─ pricing_versions      (precios; 1 version activa por agente)
            ├─ service_vehicle_prices
            └─ district_surcharges
```

Reglas no negociables:
- Un **agente nuevo = un numero nuevo**. No reusar un agente para dos numeros.
- Si el agente **no tiene filas en `agent_staff`**, necesita **su propio Google
  Calendar** configurado en `agent_business_config.config.calendar_id` antes de poder
  agendar citas. Si **tiene** filas en `agent_staff`, cada persona trae su propio
  `calendar_id` y el de `agent_business_config` queda como respaldo si algun dia se
  desactiva a todo el staff.
- `pricing_versions` solo permite **una fila `is_active = true` por `agent_id`**
  (constraint `uq_pricing_versions_one_active_per_agent`). Si se inserta una version
  nueva activa, hay que desactivar la anterior primero.

## 1) Crear el agente

```sql
INSERT INTO public.agents (
  organization_id, slug, name, role, description, is_active
) VALUES (
  '<organization_id>'::uuid,
  '<slug-unico-ej-detailing-providencia>',
  '<Nombre visible del agente>',
  'closer_comercial',
  'Agente de detailing/lavado para <numero o sucursal>',
  true
)
RETURNING id;
```

Guardar el `id` retornado: es el `agent_id` para todos los pasos siguientes.

Campos que la pagina deberia exponer: `name`, `role` (texto libre o lista fija),
`description`, `is_active` (toggle para pausar el agente sin borrarlo).

## 2) Vincular el numero/canal (`agent_channels`)

Para WhatsApp:

```sql
INSERT INTO public.agent_channels (
  organization_id, agent_id, channel, provider, external_channel_id,
  display_name, is_active, config
) VALUES (
  '<organization_id>'::uuid,
  '<agent_id>'::uuid,
  'whatsapp',
  'meta_whatsapp_cloud_api',
  '<phone_number_id de WhatsApp Cloud API>',
  '<Nombre para mostrar internamente>',
  true,
  '{
    "environment": "production",
    "inbound_enabled": true,
    "outbound_enabled": true,
    "display_name": "<igual que arriba>",
    "default_language": "es-CL",
    "rate_limit": { "messages_per_minute": 60 },
    "fallback_policy": { "on_error": "handoff_or_retry" }
  }'::jsonb
)
ON CONFLICT (provider, external_channel_id) DO UPDATE SET
  agent_id = EXCLUDED.agent_id,
  organization_id = EXCLUDED.organization_id,
  is_active = true,
  config = EXCLUDED.config,
  updated_at = now();
```

Para webchat, ver `docs/WEBCHAT_CONNECTION_GUIDE_2026-06-16.md` (mismo patron, `channel='webchat'`,
`provider='webchat_widget'`, `external_channel_id` = `widget_id` del sitio).

Campos que la pagina deberia exponer: `channel` (select: whatsapp/webchat),
`external_channel_id` (phone_number_id o widget_id, segun canal), `display_name`,
`is_active`. El resto del `config` puede quedar con defaults fijos salvo que se
necesite ajustar rate limit.

`external_channel_id` es **el dato critico**: si no calza exactamente con lo que
manda Meta (phone_number_id) o el widget (widget_id), el mensaje entra pero
`channel_config_resolver` lo rechaza con `agent_channel_not_found`.

## 3) Configuracion comercial (`agent_business_config`)

Es **una sola fila JSONB por version**, versionada (no se actualiza in-place: se
inserta una version nueva y se desactiva la anterior). La pagina deberia tratar esto
como "guardar = crear nueva version", no como un UPDATE directo.

```sql
BEGIN;

UPDATE public.agent_business_config
SET is_active = false, updated_at = now()
WHERE agent_id = '<agent_id>'::uuid AND is_active = true;

INSERT INTO public.agent_business_config (organization_id, agent_id, config, version, is_active)
SELECT
  '<organization_id>'::uuid,
  '<agent_id>'::uuid,
  '{
    "business_name": "<Nombre comercial>",
    "locale": "es-CL",
    "timezone": "America/Santiago",
    "currency": "CLP",
    "calendar_id": "<calendar_id de Google Calendar; respaldo si no hay agent_staff>",

    "coverage": {
      "districts": ["Comuna A", "Comuna B", "Comuna C"]
    },

    "staff_selection_mode": "auto",

    "schedule": [
      { "days": [1, 2, 3, 4, 5], "start_time": "09:00", "end_time": "18:00", "slot_interval_minutes": 60 },
      { "days": [6], "start_time": "09:00", "end_time": "14:00", "slot_interval_minutes": 60 }
    ],

    "booking_policy": {
      "timezone": "America/Santiago",
      "max_slots_default": 3,
      "duration_minutes_default": 120,
      "requires_address_confirmation": true,
      "requires_availability_confirmation": true
    },

    "pricing_policy": {
      "source": "legacy_pricing_workflow",
      "on_pricing_error": "handoff_or_retry_before_booking",
      "must_not_invent_prices": true,
      "requires_service_vehicle_district": true
    },

    "agent_limits": {
      "max_booking_options": 3,
      "do_not_invent_availability": true,
      "do_not_confirm_without_address": true,
      "do_not_book_without_valid_quote": true
    },

    "messages": {
      "handoff": "Te derivo con una persona para revisar esto manualmente.",
      "no_slots": "Por ahora no encontre horarios disponibles para los proximos dias. Si quieres, te puedo derivar para revisar manualmente una hora.",
      "ask_service": "Perfecto. Que servicio te interesa?",
      "ask_district": "Perfecto. Para ayudarte bien, en que comuna estas?",
      "ask_vehicle_type": "Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon."
    },

    "service_aliases": {
      "basico": "lavado_basico",
      "lavado basico": "lavado_basico",
      "premium": "lavado_premium",
      "lavado premium": "lavado_premium",
      "encerado": "encerado_full",
      "cera": "encerado_full"
    },

    "services": [
      {
        "key": "lavado_basico",
        "name": "Lavado basico",
        "aliases": ["lavado basico", "basico", "simple", "normal"],
        "description": "Mantencion rapida para dejarlo limpio por dentro y fuera.",
        "includes": ["Lavado exterior de carroceria", "Aspirado rapido del interior"],
        "duration_minutes": 60
      },
      {
        "key": "lavado_premium",
        "name": "Lavado premium",
        "aliases": ["lavado premium", "premium", "detallado"],
        "description": "Limpieza mas completa y detallada.",
        "includes": ["Lavado exterior completo", "Aspirado interior completo", "Limpieza de tablero y consola"],
        "duration_minutes": 120
      },
      {
        "key": "encerado_full",
        "name": "Encerado full",
        "aliases": ["encerado", "encerado full", "cera"],
        "description": "Proteccion y brillo para la pintura.",
        "includes": ["Lavado exterior previo", "Aplicacion de cera o sellador", "Pulido y realce de brillo"],
        "duration_minutes": 180
      }
    ]
  }'::jsonb,
  COALESCE((SELECT MAX(version) + 1 FROM public.agent_business_config WHERE agent_id = '<agent_id>'::uuid), 1),
  true;

COMMIT;
```

Campos que la pagina DEBE exponer (lo minimo viable):
- `calendar_id` (texto, obligatorio antes de activar el numero **si no va a tener
  `agent_staff`**; si va a tener personas, este campo queda como respaldo).
- `coverage.districts` (lista editable de comunas).
- `schedule[]`: una grilla de bloques `dias de semana + hora inicio + hora fin +
  intervalo en minutos` (ver detalle de formato mas abajo).
- `booking_policy.max_slots_default` (cuantas opciones de horario mostrar por turno).
- `services[]`: `name`, `description`, `includes[]`, **`duration_minutes`** por cada
  uno de los 3 servicios (los `key` no deberian ser editables desde la UI, son los
  identificadores internos que usa `rules_engine`).
- `staff_selection_mode`: select con dos opciones `auto` / `ask_customer` (solo tiene
  efecto si el agente tiene 2 o mas personas activas en `agent_staff`, ver seccion 3.5).

### Formato de `schedule` (horario de trabajo / atencion)

Cada bloque es:

```json
{ "days": [1, 2, 3, 4, 5], "start_time": "09:00", "end_time": "18:00", "slot_interval_minutes": 60 }
```

- `days`: array de numeros, `0 = domingo`, `1 = lunes`, ... `6 = sabado`.
- `start_time` / `end_time`: hora local Chile, formato `HH:MM`, 24 horas.
- `slot_interval_minutes`: cada cuantos minutos se ofrece un horario dentro del rango
  (inclusive en ambos extremos). Ej.: `09:00` a `18:00` cada `60` genera
  `09:00, 10:00, ..., 18:00`.
- Se pueden poner varios bloques (uno por cada grupo de dias con el mismo rango). La
  pagina puede modelar esto como una lista de filas "agregar bloque de horario".
- Si `schedule` queda vacio o no se configura, el sistema usa un horario por defecto
  fijo en el codigo (martes y jueves 09:00, domingo 09:00 y 15:00) — **no confiar en
  ese default para un negocio nuevo**, siempre completar `schedule` explicitamente.

`duration_minutes` por servicio se usa para calcular el bloque de tiempo real que
ocupa la cita en el calendario; si un servicio no trae `duration_minutes`, se usa
`booking_policy.duration_minutes_default`.

Notas para quien construya el formulario:
- No reinventar nombres de servicio: por ahora `rules_engine` y `resolve_pricing_from_db`
  solo reconocen los `service_code` `lavado_basico`, `lavado_premium`, `encerado_full`.
  Si se necesita un servicio nuevo, es un cambio de codigo, no solo de configuracion
  (avisar antes de exponerlo en la UI como "agregar servicio libre").
- Evitar tildes/eñes en los textos si se van a usar directamente como mensajes del bot
  (ver `RULE.md`, seccion Encoding) — no es obligatorio para los campos JSONB en si,
  pero si para `messages.*` y `services[].description`/`includes[]`, porque esos
  textos terminan en mensajes de WhatsApp y el pipeline de export/import puede
  corromper caracteres no-ASCII.

## 3.5) Personas / calendarios (`agent_staff`) — opcional

Solo necesario si el negocio tiene **mas de una persona atendiendo** con calendarios
de Google distintos. Si el agente no tiene filas activas aqui, todo sigue funcionando
con el `calendar_id`/`schedule` de `agent_business_config` (comportamiento de un solo
operador, sin cambios).

```sql
INSERT INTO public.agent_staff (
  agent_id, name, calendar_id, services, is_active, display_order, schedule
) VALUES (
  '<agent_id>'::uuid,
  '<Nombre de la persona>',
  '<calendar_id de Google Calendar de esta persona>',
  ARRAY[]::text[],  -- vacio = atiende los 3 servicios. O ej: ARRAY['lavado_premium','encerado_full']
  true,
  0,                -- orden en que aparece al listar opciones
  NULL              -- NULL = usa el schedule de agent_business_config. O un array igual al de schedule arriba.
);
```

Campos que la pagina deberia exponer por persona: `name`, `calendar_id`, `services[]`
(multi-select de los 3 servicios, vacio = "todos"), `is_active`, `display_order`, y
opcionalmente su propio `schedule[]` (mismo formato de la seccion anterior; si se deja
vacio, hereda el horario general del agente).

Como funciona la seleccion cuando hay mas de una persona elegible para el servicio
pedido:
- `staff_selection_mode = "auto"` (default): el sistema asigna una persona
  automaticamente, sin preguntarle nada al cliente.
- `staff_selection_mode = "ask_customer"`: el bot pregunta "¿Con quien prefieres
  agendar?" listando los nombres activos, y el cliente responde con el nombre o el
  numero de la opcion.

Si solo hay **una** persona elegible (o ninguna, porque no se configuro
`agent_staff`), nunca se pregunta nada — se asigna directo, igual que hoy.

## 4) Precios (`pricing_versions` + tablas hijas)

```sql
BEGIN;

UPDATE public.pricing_versions
SET is_active = false
WHERE agent_id = '<agent_id>'::uuid AND is_active = true;

INSERT INTO public.pricing_versions (agent_id, name, is_active, valid_from)
VALUES ('<agent_id>'::uuid, '<nombre version, ej. Lista 2026-06>', true, now())
RETURNING id;
-- guardar este id como <pricing_version_id>

INSERT INTO public.service_vehicle_prices (pricing_version_id, service_code, vehicle_type, base_price, is_active)
VALUES
  ('<pricing_version_id>'::uuid, 'lavado_basico',  'sedan',     25000, true),
  ('<pricing_version_id>'::uuid, 'lavado_basico',  'suv',       30000, true),
  ('<pricing_version_id>'::uuid, 'lavado_basico',  'camioneta', 32000, true),
  ('<pricing_version_id>'::uuid, 'lavado_premium', 'sedan',     35000, true),
  ('<pricing_version_id>'::uuid, 'lavado_premium', 'suv',       40000, true),
  ('<pricing_version_id>'::uuid, 'lavado_premium', 'camioneta', 42000, true),
  ('<pricing_version_id>'::uuid, 'encerado_full',  'sedan',     60000, true),
  ('<pricing_version_id>'::uuid, 'encerado_full',  'suv',       70000, true),
  ('<pricing_version_id>'::uuid, 'encerado_full',  'camioneta', 75000, true);

-- Opcional: recargo por comuna (usar '*' como district_key para "todas las demas")
INSERT INTO public.district_surcharges (pricing_version_id, district_key, surcharge, is_active)
VALUES
  ('<pricing_version_id>'::uuid, '*', 0, true);

COMMIT;
```

Campos que la pagina deberia exponer: una grilla `servicio x tipo_vehiculo -> precio`
(9 celdas con los 3 servicios fijos x los tipos de vehiculo que se quieran soportar:
`sedan`, `suv`, `camioneta`, opcionalmente `hatchback`, `moto`, `furgon`), y una tabla
aparte de recargos por comuna (opcional, default 0 para todas).

`vehicle_type` debe quedar en minusculas, sin tildes (`sedan`, no `Sedán`), porque
`resolve_pricing_from_db` normaliza pero compara contra estos valores exactos.

## 5) Checklist de validacion antes de activar un numero nuevo

Correr esto y confirmar que todas las filas existen y `is_active = true`:

```sql
SELECT a.id AS agent_id, a.name, a.is_active AS agent_active,
       ac.id AS channel_id, ac.channel, ac.external_channel_id, ac.is_active AS channel_active,
       bc.version AS business_config_version, bc.is_active AS business_config_active,
       bc.config->>'calendar_id' AS fallback_calendar_id,
       jsonb_array_length(COALESCE(bc.config->'schedule', '[]'::jsonb)) AS schedule_blocks,
       pv.id AS pricing_version_id, pv.is_active AS pricing_active,
       (SELECT count(*) FROM public.agent_staff s WHERE s.agent_id = a.id AND s.is_active = true) AS active_staff_count
FROM public.agents a
LEFT JOIN public.agent_channels ac ON ac.agent_id = a.id AND ac.is_active = true
LEFT JOIN public.agent_business_config bc ON bc.agent_id = a.id AND bc.is_active = true
LEFT JOIN public.pricing_versions pv ON pv.agent_id = a.id AND pv.is_active = true
WHERE a.id = '<agent_id>'::uuid;
```

Si alguna columna sale en `NULL` (`channel_id`, `business_config_version`,
`pricing_version_id`) o `schedule_blocks = 0`, ese numero **no esta listo para
produccion** — el bot va a responder pero va a fallar al cotizar, agendar, o mostrar
horarios. `fallback_calendar_id` puede ser `NULL` **solo si** `active_staff_count > 0`
(cada persona trae su propio calendario); si `active_staff_count = 0`,
`fallback_calendar_id` es obligatorio.

Despues de validar en SQL, probar por chat real (WhatsApp o el webchat de prueba,
ver `docs/N8N_API_SETUP.md` y `docs/WEBCHAT_CONNECTION_GUIDE_2026-06-16.md`) el flujo
completo: cotizar -> agendar -> confirmar, antes de anunciar el numero como activo.

## Fuera de alcance de esta guia (variantes futuras)

Esta guia asume que el numero nuevo es **de la misma linea de negocio** (detailing /
lavado de autos), reusando el mismo `rules_engine`/`action_executor`. Una linea de
negocio distinta (otro tipo de servicio, otro flujo de decision) requiere una copia/
variante de los workflows principales, no solo una fila nueva en estas tablas — eso
es un trabajo de desarrollo aparte, no de configuracion.

Tampoco esta soportado todavia (solo configuracion de tablas, no se puede resolver
desde la pagina sin tocar codigo):
- **Excepciones de horario**: feriados, vacaciones de una persona especifica, o
  cerrar un dia puntual. `schedule` solo modela un patron semanal recurrente.
- El flujo combinado de "cancelar y mostrar horarios nuevos en el mismo mensaje" (al
  cambiar de servicio) no pasa por la logica de seleccion de persona — usa el
  calendario que ya estuviera guardado en el estado de la conversacion.
