# Onboarding API - crear agente nuevo desde el panel

Fecha: 2026-06-22

## Que hace

Un solo webhook POST en n8n (`onboarding_create_agent`, id `OnHysjH5lvf77zbJ`) que crea,
en una sola transaccion atomica (todo o nada):

1. una fila en `agents`
2. su `agent_business_config` version 1 (activa), con horarios, servicios y mensajes
   genericos de partida para la linea de detailing/lavado de autos
3. una `pricing_versions` (activa) con `service_vehicle_prices` por defecto
   (lavado_basico/premium, encerado_full x sedan/suv/camioneta, mismos montos base
   que usa Ahumada Detailing hoy)
4. opcionalmente, si se manda `channel` en el request, una fila en `agent_channels`

No crea `agent_staff` ni `district_surcharges` — eso se sigue editando a mano
(o desde el panel directamente contra la tabla, ya tiene RLS) siguiendo
`docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md`.

El endpoint **verifica membresia**: solo crea el agente si `(user_id, organization_id)`
existe en `organization_members`. Si no, responde `forbidden` y no toca la base de datos.
Esto es defensa en profundidad — el panel tambien deberia validar la sesion de Supabase
antes de llamar a este endpoint.

## Endpoint

```
POST https://n8n.aahumada.com/webhook/onboarding-create-agent
```

Headers:
```
Content-Type: application/json
X-Onboarding-Token: <token compartido, ver abajo>
```

**Importante:** este token NO es el Anon Key de Supabase ni un JWT de usuario. Es un
secreto compartido solo entre el panel y n8n (igual patron que `WEBCHAT_WIDGET_TOKEN`
para el widget de chat). Debe vivir en una variable de entorno del backend del panel
(nunca expuesto en el cliente/navegador) — la llamada a este webhook debe hacerse desde
una API route / server action de Next.js, no desde el browser.

## Request body

```json
{
  "user_id": "<uuid de auth.users, el usuario logueado en el panel>",
  "organization_id": "<uuid de organizations, la org del usuario>",
  "agent_name": "Nombre del negocio o linea",
  "business_name": "Opcional, default = agent_name",
  "calendar_id": "Opcional, ej. calendario@group.calendar.google.com",
  "districts": ["Opcional, array de comunas, ej. Providencia, Las Condes"],
  "channel": {
    "channel": "whatsapp | webchat | n8n_chat",
    "provider": "ej. meta_whatsapp_cloud_api, webchat_widget",
    "external_channel_id": "ej. el phone_number_id de Meta, o el widget_id del webchat",
    "display_name": "Opcional, nombre visible del canal"
  }
}
```

`channel` es opcional completo — si no se manda (o falta `channel`/`provider`/
`external_channel_id` dentro de el), el agente se crea sin canal y se vincula despues
a mano (insertando en `agent_channels`, ver guia).

## Response (siempre HTTP 200, revisar el campo `ok`)

Exito:
```json
{
  "ok": true,
  "agent_id": "uuid",
  "organization_id": "uuid",
  "slug": "nombre-del-negocio-ab12cd",
  "agent_name": "Nombre del negocio o linea",
  "business_config_id": "uuid",
  "pricing_version_id": "uuid",
  "prices_created": 9,
  "channel_created": true,
  "channel_id": "uuid o null"
}
```

Error (no se creo nada):
```json
{ "ok": false, "error": "forbidden", "message": "..." }
{ "ok": false, "error": "creation_failed", "message": "..." }
{ "ok": false, "error": "missing_user_id" }
{ "ok": false, "error": "missing_organization_id" }
{ "ok": false, "error": "missing_agent_name" }
{ "ok": false, "error": "invalid_onboarding_token" }
```

## Flujo esperado en el panel (Next.js)

1. Usuario logueado con Supabase Auth, ya tiene `organization_id` (via la tabla
   `organization_members`, que el panel puede leer directo con RLS usando el cliente
   de Supabase autenticado).
2. Usuario llena un formulario simple: nombre del negocio, comuna(s) que cubre,
   (opcional) calendario de Google, (opcional) datos del canal si ya los tiene.
3. El panel llama a este webhook **desde el servidor** (API route/server action),
   nunca desde el cliente, mandando el token en el header.
4. Si `ok: true`, redirige al usuario a la pantalla de edicion del agente recien creado
   (`agent_id`), donde puede seguir ajustando horarios/precios/servicios usando lectura
   y escritura directa contra `agent_business_config`/`pricing_versions` (con RLS, el
   usuario solo ve y edita lo de su propia organizacion).
5. Si `ok: false`, mostrar `message` (o un mensaje generico si no viene) y no avanzar.

## Configuracion pendiente (a hacer una sola vez, manual)

No existe API de variables en esta licencia de n8n (confirmado: `GET /api/v1/variables`
devuelve 403 "Your license does not allow for feat:variables"), asi que el token hay
que setearlo a mano en el entorno de la instancia de n8n, igual que se hizo para
`WEBCHAT_WIDGET_TOKEN`:

```
ONBOARDING_API_TOKEN=<secreto, NO ponerlo en este archivo>
```

> ⚠️ **Este repositorio es público.** El valor real de este token estuvo escrito acá
> hasta el 2026-08-05, o sea que hay que darlo por comprometido y **rotarlo**
> (generar uno nuevo, actualizarlo en el entorno de n8n y en el backend del panel).
> Generar uno con `openssl rand -hex 32`. El valor vive solo en el entorno del
> servidor y en el del panel — nunca en el repo.

Hasta que esa variable no este seteada en el servidor de n8n, el endpoint rechaza
**todas** las llamadas con `{"ok": false, "error": "missing_onboarding_token_config"}`
(falla cerrado, no abierto).

## Agregar/actualizar un canal en un agente ya creado

`onboarding_create_agent` solo puede vincular un canal **en el momento de crear el
agente** (si se manda `channel` en el body original). Si el agente ya existe (por
ejemplo, se creo desde el panel sin canal, o se necesita cambiar el numero despues),
usar este segundo endpoint, agregado 2026-07-28:

```
POST https://n8n.aahumada.com/webhook/onboarding-add-channel
```

Mismos headers que el endpoint de creacion (`Content-Type: application/json`,
`X-Onboarding-Token: <mismo token compartido>`).

Body:

```json
{
  "user_id": "<uuid del usuario logueado>",
  "organization_id": "<uuid de la organizacion>",
  "agent_id": "<uuid del agente ya creado>",
  "channel": {
    "channel": "whatsapp",
    "provider": "meta_whatsapp_cloud_api",
    "external_channel_id": "<phone_number_id de Meta>",
    "whatsapp_business_account_id": "<WABA id de Meta, opcional pero recomendado>",
    "display_name": "Opcional"
  }
}
```

`whatsapp_business_account_id` (el WABA id, distinto del `phone_number_id`) es opcional
y se guarda en `agent_channels.config.whatsapp_business_account_id` — no participa en
el `ON CONFLICT` (esa clave sigue siendo `(provider, external_channel_id)`) pero queda
registrado para el paso manual de suscribir la app al webhook de esa WABA
(`POST /{waba_id}/subscribed_apps`, con el `META_ACCESS_TOKEN` compartido), que solo
hace falta una vez por WABA nueva, no por numero.

Valida que `(user_id, organization_id)` sean miembros de esa organizacion Y que
`agent_id` pertenezca a esa misma `organization_id` antes de tocar la base. Hace un
`INSERT ... ON CONFLICT (provider, external_channel_id) DO UPDATE` sobre
`agent_channels` (mismo patron que `docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md` seccion
2) — si el `external_channel_id` ya existia vinculado a otro agente, este llamado se lo
"roba" y lo reasigna al `agent_id` nuevo (comportamiento intencional: sirve para migrar
un numero de un agente a otro).

Respuesta exito:
```json
{
  "ok": true,
  "channel_id": "uuid",
  "agent_id": "uuid",
  "organization_id": "uuid",
  "channel": "whatsapp",
  "provider": "meta_whatsapp_cloud_api",
  "external_channel_id": "1234567890"
}
```

Errores: `missing_onboarding_token_config`, `invalid_onboarding_token`,
`missing_user_id`, `missing_organization_id`, `missing_agent_id`, `missing_channel`,
`missing_provider`, `missing_external_channel_id`, `forbidden` (el usuario no pertenece
a esa organizacion), `agent_not_found` (el agente no existe o es de otra
organizacion), `creation_failed`.

**Importante — esto NO da de alta el numero en Meta.** `external_channel_id` (el
`phone_number_id`) tiene que existir previamente en el WhatsApp Business Platform /
Meta Business Manager de la cuenta compartida (hoy toda la plataforma usa un unico
`META_ACCESS_TOKEN`/WABA para todos los agentes — no hay credenciales de Meta por
cliente). Este endpoint solo mapea ese `phone_number_id` a un `agent_id` en
`agent_channels`, que es lo que usa `2.1 channel_config_resolver` para enrutar los
mensajes entrantes al agente correcto. Pasos previos, fuera de este endpoint:
1. Agregar el numero de telefono en el WhatsApp Business Platform (Meta Business
   Suite) de la cuenta compartida.
2. Si el numero es nuevo y pide verificacion en dos pasos, completar el registro via
   el webhook ya existente `whatsapp_register_number`
   (`workflows/exports/meta_whatsapp/whatsapp_register_number.json`,
   `POST /webhook/whatsapp-register-number` con `{phone_number_id, pin}`).
3. Recien ahi llamar a `onboarding-add-channel` para que el bot empiece a responder
   por ese numero.

Workflow n8n: `onboarding_add_channel` (id `0rz0ue6OkEKRlqUG`).

## Agregar/quitar servicios del catalogo de un agente (nuevo 2026-07-31)

Hasta ahora los servicios de un agente (`agent_business_config.config.services[]`) y
sus precios (`service_vehicle_prices`) solo se podian editar escribiendo directo en la
base de datos. Este endpoint nuevo permite al panel agregar, actualizar o quitar un
servicio del catalogo de un agente ya creado, con precios opcionales, sin tocar la DB
a mano.

```
POST https://n8n.aahumada.com/webhook/onboarding-manage-service
```

Mismos headers que los otros dos endpoints (`Content-Type: application/json`,
`X-Onboarding-Token: <mismo token compartido>`).

Body:

```json
{
  "user_id": "<uuid del usuario logueado>",
  "organization_id": "<uuid de la organizacion>",
  "agent_id": "<uuid del agente ya creado>",
  "action": "add",
  "service": {
    "key": "tinte",
    "name": "Tinte de barba",
    "aliases": ["tinte", "tinte de barba", "colorear barba"],
    "description": "Coloracion de barba.",
    "duration_minutes": 25
  },
  "prices": [
    { "vehicle_type": "Clasico", "base_price": 12000 },
    { "vehicle_type": "Moderno", "base_price": 15000 }
  ]
}
```

Notas de los campos:

- `action`: `"add"` o `"remove"`, obligatorio.
- `service.key`: identificador estable del servicio (snake_case, sin espacios), es la
  clave con la que se hace upsert/match — obligatorio siempre.
- `service.name`, `.aliases[]`, `.description`, `.duration_minutes`: solo se usan (y
  solo `name` es obligatorio) cuando `action = "add"`. Si el `key` ya existe en el
  catalogo, `add` **reemplaza** ese servicio completo (funciona tambien como "editar"
  un servicio existente, no hace falta una accion separada). Con `action = "remove"`
  solo se necesita `service.key`, el resto de `service.*` se ignora.
- `aliases[]`: palabras/frases que el bot reconoce en el chat para identificar que el
  cliente quiere este servicio (ademas de `key` y `name`, que tambien matchean). Mientras
  mas variantes reales de como la gente lo pide en Chile, mejor deteccion.
- `prices[]`: opcional, solo aplica en `action = "add"`. Cada entrada es
  `{ vehicle_type, base_price }`, donde `vehicle_type` **no es literalmente un
  vehiculo** — es el valor del "eje de clasificacion" propio del rubro de ese agente
  (tipo de auto para detailing, categoria de estilista/barbero para salon/barberia,
  etc; el nombre de columna es historico). Los valores validos para un agente
  especifico estan en
  `agent_business_config.config.classification_dimension.values[].key` de ESE
  agente (ej. para una barberia real: `"Clasico"` / `"Moderno"`) — **el panel debe
  leer ese campo primero y ofrecer esos valores exactos** en el formulario de precios
  (dropdown, no texto libre), no inventar valores. La comparacion de precios en el
  bot es case-insensitive (normaliza a minusculas), asi que la mayuscula/minuscula
  exacta no rompe nada, pero usar el `key` tal cual evita confusion. Si no se manda
  `prices`, el servicio queda creado pero sin precio — el bot lo reconoce en la
  conversacion pero no podra cotizarlo hasta que se agreguen precios (despues, con
  otra llamada `add` al mismo `key`, o editando `service_vehicle_prices` directo).
- Con `action = "remove"`: el servicio se quita de `services[]` (el bot deja de
  reconocerlo/ofrecerlo) y sus filas en `service_vehicle_prices` para la
  `pricing_version` activa del agente quedan con `is_active = false` — **nunca se
  borran**, tanto el servicio como el precio siguen existiendo en versiones/filas
  anteriores para historial y para reservas ya hechas con ese servicio.

Como con `onboarding_add_channel`, valida que `(user_id, organization_id)` sean
miembros de esa organizacion y que `agent_id` pertenezca a esa misma
`organization_id` antes de tocar la base. Ademas requiere que el agente tenga una
`agent_business_config` activa (todo agente creado por `onboarding_create_agent`
la tiene) — si no la tiene, responde `config_not_found` sin escribir nada.

Cada llamada exitosa crea una **nueva version** de `agent_business_config` (la
version anterior queda con `is_active = false`, nunca se borra ni se sobreescribe —
mismo mecanismo de versionado que ya usa el resto del sistema), asi que hay historial
completo de cada cambio de catalogo.

Respuesta exito:
```json
{
  "ok": true,
  "action": "add",
  "service_key": "tinte",
  "service_already_existed": false,
  "new_config_version": 2,
  "prices_action": "insert",
  "prices_written_count": 2,
  "message": "Servicio \"tinte\" agregado."
}
```

`prices_action` es `"insert"` (add con precios), `"deactivate"` (remove), o `"none"`
(add sin `prices[]`, o remove/add cuando el agente no tiene una `pricing_version`
activa todavia). `message` es un texto ya redactado en español, listo para mostrar
directo en el panel (incluye avisos, ej. si se pidieron precios pero no se pudieron
escribir, o si el servicio quedo sin precio).

Errores: `missing_onboarding_token_config`, `invalid_onboarding_token`,
`missing_user_id`, `missing_organization_id`, `missing_agent_id`, `invalid_action`
(si `action` no es `add`/`remove`), `missing_service_key`, `missing_service_name`
(solo si `action = "add"` y falta `service.name`), `forbidden` (el usuario no
pertenece a esa organizacion), `agent_not_found` (el agente no existe o es de otra
organizacion), `config_not_found` (el agente no tiene `agent_business_config`
activa).

Verificado en vivo 2026-07-31 contra el agente de prueba "Barberia QA Test Fase G"
(`31479a3e-ed51-4d1d-95e6-c8f92bef2f8d`): add con 2 precios, remove del mismo
servicio, y los 2 casos de error (`agent_not_found`, `invalid_onboarding_token`) —
en los 3 casos exitosos se confirmo por SQL directo que las versiones de config
anteriores y las filas de precio desactivadas siguen intactas (nada se borra).

Workflow n8n: `onboarding_manage_service` (id `bnQxcyxo3Hwwb7CK`).

### Prompt para implementar la UI en el panel web

Para pasarle a quien construya la pantalla en el panel (Next.js + Supabase),
usar el siguiente prompt tal cual, reemplazando solo lo que corresponda a las
convenciones de ese repo (nombres de componentes, cliente de fetch, etc.):

> Necesito una seccion "Servicios" dentro de la pantalla de edicion de un agente
> (`/agents/[agent_id]` o equivalente en este panel) que permita agregar, editar y
> quitar servicios del catalogo de ese agente, consumiendo un webhook de n8n ya
> existente y probado — **no hay que crear ninguna tabla ni endpoint nuevo, solo
> consumir el que ya existe**.
>
> **Endpoint**: `POST https://n8n.aahumada.com/webhook/onboarding-manage-service`,
> con headers `Content-Type: application/json` y `X-Onboarding-Token: <token>`
> (el token vive en una variable de entorno del servidor del panel, ej.
> `ONBOARDING_API_TOKEN` — la llamada DEBE hacerse desde una API route / server
> action de Next.js, nunca desde el cliente/navegador, porque el token es un
> secreto compartido, no un JWT de usuario).
>
> **Datos que ya existen y hay que leer primero** (via el cliente de Supabase
> autenticado, con RLS, lectura directa — no via este webhook):
> - `agent_business_config` activa del agente (`is_active = true`), campo
>   `config.services[]` (array de `{key, name, aliases[], description,
>   duration_minutes}`) — es la lista actual a mostrar/editar.
> - `config.classification_dimension.values[]` (array de `{key, label?,
>   keywords[]}`) de esa misma config — son los valores validos de "categoria"
>   para los precios de este agente (ej. tipo de vehiculo para un detailing,
>   categoria de estilista para un salon — el nombre varia por rubro, usar
>   `config.classification_dimension.label` como titulo de columna/campo en vez
>   de un nombre fijo). **Estos valores deben ofrecerse como opciones fijas
>   (dropdown/chips), nunca como texto libre**, porque el motor de precios
>   matchea contra ellos.
> - Precios actuales: `service_vehicle_prices` filtrado por la
>   `pricing_versions` activa del agente (`is_active = true`) y `is_active = true`
>   en la fila de precio — columnas `service_code` (= `key` del servicio),
>   `vehicle_type` (= uno de los `classification_dimension.values[].key`),
>   `base_price`.
>
> **UI**:
> 1. Tabla/lista de servicios actuales: nombre, key, aliases (resumidos), y una
>    mini-tabla de precios por categoria (columnas = cada
>    `classification_dimension.values[].key`, con el precio o "Sin precio" si
>    falta).
> 2. Boton "Agregar servicio" → formulario: key (slug, autogenerado desde el
>    nombre pero editable, solo minusculas/numeros/guion_bajo), nombre, aliases
>    (input de tags/chips), descripcion (opcional), duracion en minutos
>    (opcional), y una fila de precio por cada valor de `classification_dimension`
>    (todas opcionales, pero avisar en la UI que sin precio el bot no podra
>    cotizar ese servicio todavia).
> 3. Boton "Editar" sobre un servicio existente → mismo formulario precargado.
>    Al guardar, se llama al mismo endpoint con `action: "add"` (el backend hace
>    upsert por `key`, reemplaza el servicio completo — mandar todos los campos,
>    no solo los que cambiaron).
> 4. Boton "Quitar" con confirmacion (explicar en el dialogo: "el servicio deja
>    de estar disponible para el bot, pero el historial no se borra") → llama al
>    endpoint con `action: "remove"` y solo `service.key`.
> 5. Despues de cada llamada exitosa (`ok: true`), refrescar la lista leyendo de
>    nuevo `agent_business_config` (la version cambio) y `service_vehicle_prices`.
>    Mostrar el campo `message` de la respuesta como toast/notificacion (ya viene
>    redactado en español).
> 6. Si `ok: false`, mostrar el `message` si viene, o un texto generico segun
>    `error` (`forbidden` → "no tienes permiso sobre este agente",
>    `agent_not_found` → "agente no encontrado", `config_not_found` → "este
>    agente no tiene configuracion de negocio activa, contactar soporte",
>    cualquier otro → "ocurrio un error, intenta de nuevo").
>
> Documentacion completa del contrato del endpoint (request/response/errores):
> `docs/ONBOARDING_API_2026-06-22.md`, seccion "Agregar/quitar servicios del
> catalogo de un agente".
