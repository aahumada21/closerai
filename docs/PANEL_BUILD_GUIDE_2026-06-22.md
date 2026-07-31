# Guia para construir el panel Next.js (instrucciones para el agente de la pagina)

Fecha: 2026-06-22

Este documento es para quien construya el panel de administracion (Next.js,
`closer.aahumada.com`). Describe la arquitectura de datos ya lista en el backend
(Supabase + n8n), que pantallas construir, y como leer/escribir cada cosa.

## 0. Que YA existe (no hay que construirlo de nuevo)

- Base de datos: Supabase Postgres real, proyecto `pmqeilwtyaxfsvmtznag`
  (`https://pmqeilwtyaxfsvmtznag.supabase.co`). Auth de Supabase ya provisionado.
- Multi-tenancy con Row Level Security ya activa en **todas** las tablas que el
  panel necesita tocar (detalle en seccion 2). Esto significa: si el panel usa
  el cliente de Supabase autenticado con la sesion del usuario (no el service
  role), **la base de datos misma garantiza que cada usuario solo ve y edita los
  datos de su propia organizacion**. No hay que reimplementar el filtro de
  tenant a mano en cada query — RLS ya lo hace.
- Un endpoint n8n para crear un agente nuevo de punta a punta (transaccion
  atomica): ver `docs/ONBOARDING_API_2026-06-22.md`. Es el **unico** flujo de
  escritura que no pasa directo por Supabase — pasa por un webhook de n8n.
- Un health-check automatico cada 30 minutos que llena la tabla `health_alerts`
  con problemas detectados por agente (sin horarios, sin calendario, clientes
  sin respuesta, etc): ver `docs/HEALTH_CHECK_2026-06-22.md`.
- Una guia exhaustiva de la forma exacta de cada tabla/columna/JSON:
  `docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md`. Es la referencia para construir
  los formularios — no la reescribo aca, solo resumo lo necesario para orientarse.

## 1. Lo que falta y NO es responsabilidad de este panel (todavia)

Para evitar sobre-alcance: estas cosas son gaps conocidos del producto pero
**no** hay que resolverlas en el panel ahora:

- Conexion de WhatsApp Business (Meta) — requiere verificacion de negocio en
  Meta, no es self-service hoy. El panel puede mostrar el estado (`agent_channels`)
  pero no puede "conectar" un numero de WhatsApp nuevo automaticamente todavia.
- **Actualizacion 2026-06-22**: la conexion de Google Calendar via OAuth ya
  esta implementada del lado de n8n — ver `docs/GOOGLE_CALENDAR_OAUTH_2026-06-22.md`
  para el boton "Conectar Google Calendar" y el contrato exacto. Falta un
  prerequisito externo (Google Cloud OAuth Client, lo crea el usuario) y falta
  cablear el resultado al booking real (deliberadamente no hecho todavia, ver
  esa misma guia). El panel puede implementar el boton de conexion ya mismo.
- Cobros/planes/billing — no existe ningun sistema de billing todavia.
- Edicion de horarios feriados/excepciones puntuales — el `schedule` es semanal
  recurrente, no soporta "cerrado el 25/12" todavia.

## 2. Modelo de tenancy: como saber a que organizacion pertenece el usuario

No existe (todavia) un flujo de **signup self-service**. Hoy, para que un
usuario nuevo pueda entrar al panel y ver datos, alguien (yo, manualmente) tiene
que:
1. Crear la fila en `organizations` (o reusar una existente).
2. Crear el usuario en Supabase Auth (o que el usuario se registre solo con
   email/password y yo despues lo vincule).
3. Insertar la fila en `organization_members (user_id, organization_id, role)`.

Sin esa fila en `organization_members`, el usuario puede loguearse pero **no
ve nada** (todas las queries con RLS le devuelven cero filas). Si quieres
implementar un signup self-service mas adelante, va a necesitar un endpoint
nuevo tipo n8n (parecido al de onboarding) porque la creacion de la primera
organizacion y su primer miembro no tiene policy de INSERT por diseno (para que
nadie pueda auto-asignarse a una organizacion ajena escribiendo directo a la
tabla). Por ahora, asume que cuando un usuario inicia sesion, ya existe su fila
en `organization_members` (provisionada a mano).

Para resolver la organizacion del usuario logueado:

```sql
select organization_id, role
from organization_members
where user_id = auth.uid();
```

Con el cliente de Supabase JS, esto es simplemente:
```ts
const { data } = await supabase
  .from("organization_members")
  .select("organization_id, role")
  .single();
```
(RLS ya filtra por `user_id = auth.uid()`, no hace falta agregar `.eq()`.)

Un usuario puede pertenecer a mas de una organizacion (la tabla lo permite),
pero para esta linea de negocio (un dueno = un negocio) probablemente alcance
con tomar la primera fila. Si mas adelante hay usuarios con multiples
organizaciones, hay que agregar un selector de organizacion activa en el panel.

## 3. Tablas con RLS ya lista (acceso directo desde el panel)

Todas estas tablas tienen RLS activada con el patron "miembro de la
organizacion puede SELECT/INSERT/UPDATE, nunca DELETE" (el sistema usa borrado
logico via `is_active = false`, nunca `DELETE`). Usa siempre el cliente de
Supabase con la sesion del usuario (anon key + JWT de sesion), **nunca** el
service role key desde el cliente del navegador.

| Tabla | Para que | Notas |
|---|---|---|
| `organizations` | Nombre de la empresa, `alert_whatsapp_number`, `alert_email` | Solo SELECT/UPDATE (no INSERT, ver seccion 2) |
| `agents` | Lista de "numeros"/lineas de atencion de la organizacion | `slug` unico solo por organizacion, no global |
| `agent_business_config` | Horarios, servicios, cobertura, mensajes, calendario fallback | Es **versionado**: nunca hagas UPDATE de una version vieja, siempre INSERT una fila nueva con `version = max(version)+1, is_active = true` y desactiva (`is_active=false`) la version anterior. Ver seccion 4. |
| `agent_staff` | Personas/calendarios cuando el agente tiene mas de un calendarista | `services text[]` vacio = "atiende todos los servicios" |
| `pricing_versions` + `service_vehicle_prices` + `district_surcharges` | Precios por servicio x tipo de vehiculo, y recargos por comuna | Tambien versionado: solo una `pricing_versions.is_active = true` por agente (constraint de BD) |
| `agent_channels` | Que canales (WhatsApp/webchat) estan conectados a cada agente | El panel puede leer y crear filas de canal `webchat` (no requiere Meta); para `whatsapp` solo mostrar estado, no crear (ver seccion 1) |
| `health_alerts` | Alertas de salud del agente (solo lectura) | Sin policy de INSERT/UPDATE para el panel a proposito — las escribe n8n. El panel solo lee y muestra. |

## 4. Por que `agent_business_config` y `pricing_versions` son "versionados"

Estas dos tablas **no se editan in-place**. El patron es:
1. Leer la version activa actual (`is_active = true`).
2. Construir el nuevo `config`/precios completo (no un parche parcial).
3. En una transaccion (o dos llamadas seguidas, dado que hay RLS de por medio):
   - `UPDATE agent_business_config SET is_active = false WHERE agent_id = X AND is_active = true`
   - `INSERT INTO agent_business_config (agent_id, organization_id, version, is_active, config) VALUES (X, org_id, version_anterior + 1, true, nuevo_config)`

Esto preserva historial completo de cambios de configuracion (auditable) y es
exactamente como ya opera el resto del sistema (cada cambio de precio o de
horario en este proyecto se hizo asi durante esta sesion). El panel deberia
ofrecer "Guardar cambios" como una operacion que craa una version nueva, no que
edita la version vigente.

## 5. Forma del JSON de `agent_business_config.config`

Resumen (la referencia completa, campo por campo, esta en
`docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md`):

```json
{
  "calendar_id": "alguien@group.calendar.google.com",
  "coverage": { "districts": ["Providencia", "Las Condes"] },
  "staff_selection_mode": "auto",
  "schedule": [
    { "days": [1,2,3,4,5], "start_time": "09:00", "end_time": "18:00", "slot_interval_minutes": 60 },
    { "days": [6], "start_time": "09:00", "end_time": "14:00", "slot_interval_minutes": 60 }
  ],
  "services": [
    {
      "key": "lavado_basico",
      "name": "Lavado basico",
      "aliases": ["basico", "simple"],
      "description": "...",
      "includes": ["..."],
      "duration_minutes": 60
    }
  ],
  "service_aliases": { "basico": "lavado_basico" },
  "booking_policy": { "...": "..." },
  "pricing_policy": { "...": "..." },
  "agent_limits": { "...": "..." },
  "messages": { "handoff": "...", "no_slots": "...", "ask_service": "..." }
}
```

`days`: `0` = domingo ... `6` = sabado. El formulario de horarios deberia ser
"agregar bloque: dias de la semana + hora inicio + hora fin + intervalo entre
turnos en minutos", no un campo de texto libre.

## 6. Pantallas sugeridas (orden de prioridad)

1. **Dashboard**: lista de agentes de la organizacion + estado de
   `health_alerts` abiertas (rojo si hay `severity = 'critical'` sin resolver).
   Esta es la pantalla que mas valor da de inmediato porque hoy esas alertas
   solo llegan por WhatsApp/email.
2. **Alta de agente nuevo**: formulario simple (nombre del negocio, comunas,
   calendario opcional) que llama al webhook de onboarding
   (`docs/ONBOARDING_API_2026-06-22.md`) desde el servidor (API route), nunca
   desde el browser (el token del webhook es secreto).
3. **Editor de configuracion del agente**: horarios, servicios, mensajes,
   cobertura — lee/escribe `agent_business_config` con el patron de
   versionado de la seccion 4.
4. **Editor de precios**: tabla servicio x tipo de vehiculo, mismo patron de
   versionado sobre `pricing_versions`/`service_vehicle_prices`. Recargos por
   comuna en `district_surcharges` si aplica.
5. **Staff** (si el negocio tiene mas de una persona/calendario): CRUD sobre
   `agent_staff`.
6. **Canales**: ver estado de `agent_channels`; permitir agregar un canal
   `webchat` propio; para `whatsapp`, solo mostrar estado (fuera de alcance
   conectar uno nuevo desde aca, ver seccion 1).
7. **Configuracion de alertas**: editar `alert_whatsapp_number`/`alert_email`
   en `organizations` (UPDATE simple, ya tiene RLS).

## 7. Reglas no negociables para el panel

- Todas las lecturas/escrituras de las tablas de la seccion 3 usan el cliente
  de Supabase **autenticado con la sesion del usuario** (anon key publica +
  JWT de sesion). Nunca uses el `service_role` key desde codigo que corre en
  el navegador — eso saltaria por completo el RLS y rompe el aislamiento entre
  organizaciones.
- El unico lugar donde se necesita un secreto de servidor (no expuesto al
  cliente) es para llamar al webhook de onboarding (el `ONBOARDING_API_TOKEN`),
  y debe llamarse desde una API route / server action, nunca desde el browser.
- Nunca usar `DELETE` contra estas tablas (no hay policy para eso, y aunque la
  hubiera, el sistema completo asume borrado logico via `is_active = false`).
- `agent_business_config` y `pricing_versions` se versionan, no se editan
  in-place (seccion 4).
- `health_alerts` es de **solo lectura** desde el panel.
