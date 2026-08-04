# Aislamiento multi-tenant del calendario

Fecha: 2026-08-02 · Estado: **código corregido y desplegado; queda remediación de datos**

## El problema

El fallback de última instancia para resolver el calendario de un agente apuntaba a
un ID hardcodeado que **no era un calendario neutral: era el calendario de producción
de Ahumada Detailing**, un cliente real.

```js
calendar_id:
  state.calendar_id ||
  ctx.agent_business_config?.config?.calendar_id ||
  "0806113eec...@group.calendar.google.com",   // <- calendario de Ahumada
```

Cualquier agente sin OAuth y sin `calendar_id` propio escribía y leía el calendario
de Ahumada.

## No era hipotético: ya había pasado

Al auditar la base, dos agentes sin calendario propio ya habían creado eventos
reales ahí:

| Agente | Citas creadas | Aún activas | Última |
|---|---:|---:|---|
| Salon Bella (Test) | 25 | 20 | 2026-07-30 |
| Detailing 01-test | 24 | 11 | **2026-08-02** |

**31 eventos activos** en el calendario de un cliente real. `Detailing 01-test`
además tiene un número de WhatsApp real (`1041798619026307`), no un canal de QA, así
que sus reservas podrían ser de clientes reales.

## Alcance real: 2 fallbacks, no 1

El reporte original señalaba `6 action_executor / build_execution_context`. Había un
segundo, no reportado:

| Workflow | Nodo | Tipo |
|---|---|---|
| `6 action_executor` | `build_execution_context` | fallback `\|\|` |
| `6.10 reschedule_booking` | `normalize_reschedule_input` | fallback `\|\|` |

Y quitar el hardcode **no alcanzaba**: aguas abajo, `6.2`/`6.3`/`6.4` hacían
`calendar_id || "primary"`. `"primary"` es el calendario principal de la credencial
de Google compartida de n8n — otra fuga cross-tenant, solo que a un buzón distinto en
vez de al de Ahumada.

## La decisión: fail-safe, no calendario neutral

Se evaluaron las dos opciones. Se eligió **fail-safe** porque es lo que el propio
sistema ya declara: `health_check_agents` emite la alerta `missing_calendar`
(severidad `critical`) con el mensaje *"no tiene calendario configurado … **no puede
agendar**"*. Ya se disparó 6 veces.

Un calendario neutral contradiría esa semántica y, peor, le confirmaría al cliente
una reserva que el negocio nunca vería — un falso éxito silencioso. Fallar es más
honesto que agendar en el vacío.

## Qué se cambió

1. **Los 2 fallbacks** ya no tienen el ID hardcodeado: si no hay calendario propio,
   queda `null`.
2. **Guard en `6.2`, `6.3` y `6.4`** (nodo `merge_calendar_auth_result`, que es donde
   se conoce *a la vez* el `calendar_id` pasado y si hay OAuth):

```js
const resolvedCalendarId =
  staffCalendarId || (auth.connected === true ? auth.calendar_id : null) || null;

if (!resolvedCalendarId) {
  throw new Error('calendar_not_configured: ...');
}
```

El guard va ahí y no en `build_execution_context` por un motivo concreto: en
`build_execution_context` **todavía no se sabe si el agente tiene OAuth** (eso se
resuelve después, con `get_valid_calendar_token`). Poner el corte antes bloquearía
por error a un agente conectado por OAuth que no tenga `calendar_id` en su config.

3. **Sanitización de `jsonExample`** en `6.5`, `6.6` y `6.11`. Esos campos solo
   derivan el *esquema* de entrada del sub-workflow (nombres y tipos), no son valores
   de runtime — así que no eran una fuga funcional. Pero contenían el calendario de
   Ahumada, un teléfono real (`56949186386`) y UUIDs de leads reales como "ejemplo".
   Reemplazados por placeholders.

## Qué NO cambió

El camino cuando sí hay calendario configurado —con o sin OAuth— es idéntico.
Verificado con 23 asserts contra el código ya desplegado (`(a)` OAuth, `(b)`
`calendar_id` propio sin OAuth, `(b2)` Ahumada con ambos, `(c)` sin ninguno):

| Caso | Antes | Ahora |
|---|---|---|
| (a) con OAuth | usa el calendario del OAuth | **igual** |
| (b) sin OAuth, con `calendar_id` | usa el suyo | **igual** |
| (b2) Ahumada (OAuth + `calendar_id`) | su calendario | **igual** |
| (c) sin ninguno | **calendario de Ahumada** | **corta el flujo** |

Ahumada nunca dependió del fallback: tiene `calendar_id` explícito **y** OAuth. La
nota de `GOOGLE_CALENDAR_OAUTH_2026-06-22.md` que decía que no tenía fila en
`google_calendar_connections` quedó desactualizada — hoy sí la tiene.

## Consecuencia a tener en cuenta

Los agentes sin calendario propio **ya no pueden agendar**. Es el comportamiento
correcto, pero es un cambio visible: antes "funcionaba" escribiendo en el calendario
equivocado.

> **Actualizado 2026-08-02 12:41**: `Detailing 01-test` ya tiene calendario propio
> (`d2f5e77c…`, versión 8 de su config, distinto al de Ahumada), así que **sí puede
> agendar** — verificado ejecutando el código desplegado de `6.2`/`6.3`/`6.4` con ese
> valor y con el escenario de QA `569900055` (5/5 PASS). Quedan **9** agentes sin
> calendario, todos de prueba o inactivos.

Para que un agente sin calendario vuelva a agendar hay que darle un `calendar_id`
propio:

```sql
-- reemplazar por un calendario real dedicado a ese agente
UPDATE agent_business_config
SET config = config || '{"calendar_id":"<id-del-calendario>@group.calendar.google.com"}'::jsonb
WHERE agent_id = '<agent_id>' AND is_active = true;
```

(Conviene hacerlo con el versionado habitual —desactivar la fila y crear la
siguiente— en vez de mutar en el lugar, igual que hace `onboarding_manage_service`.)

## Remediado 2026-08-04: los 31 eventos ya creados

Se borraron los 31 del calendario de Ahumada (31 eliminados en Google, 0 fallos) y
sus filas quedaron marcadas como canceladas en `appointments` con
`cancel_reason = 'limpieza aislamiento multi-tenant 2026-08-02'` — no se borró
ninguna fila, queda el rastro de que existieron.

Antes de borrar se revisó uno por uno: **los 31 eran datos sintéticos de prueba**
(`Cliente QA`, `Cliente Manual QA`, `Test Confirm Fix`, `E2E ...` con teléfonos
malformados tipo `56d…`/`56s…`). El único con teléfono real era "Agustin", con 2
eventos ya pasados. Ningún cliente real iba a presentarse a una cita que
desaparecía. El script incluía además un guard que abortaba si aparecía algún
teléfono fuera de los patrones de prueba.

Verificado después: **0 citas activas de otros agentes** en el calendario de Ahumada.

## Cómo detectar si vuelve a pasar

```sql
SELECT ag.name AS agente, ap.event_id, ap.start_at, ap.status
FROM appointments ap
JOIN lead_state ls ON ls.lead_id = ap.conversation_id
JOIN agents ag ON ag.id = ls.agent_id
WHERE ag.name <> 'Ahumada Detailing Closer'
  AND ap.cancelled_at IS NULL AND ap.status = 'confirmed'
ORDER BY ap.start_at;
```

Debe devolver 0 filas mientras cada agente tenga su propio calendario. Si aparece
algo, revisar primero qué agente lo creó y con qué `calendar_id`.

## Hallazgo lateral: Ahumada tiene dos calendarios

Al remediar esto apareció una discrepancia que **no se tocó** y conviene decidir:

| Origen | Calendar ID | Nombre real | Último evento |
|---|---|---|---|
| `agent_business_config.config.calendar_id` | `0806113eec…` | **"Ahumada Detailing"** | 21/07 |
| `google_calendar_connections.calendar_id` | `a855a9b4…` | "AI Closer - Agenda" | 05/07 |

Los dos tienen cientos de eventos. El de la conexión OAuth quedó congelado el 05/07
—coincide con que `google_calendar_connections.updated_at` no se actualiza desde el
04/07— y desde entonces todo cae en el de la config, que es el que lleva el nombre
del negocio.

Importa porque el guard de `merge_calendar_auth_result` da prioridad al de la config
por sobre el de la conexión OAuth. Hoy eso coincide con lo que venía pasando en la
práctica y apunta al calendario correcto, pero si algún día se re-conecta el OAuth,
conviene confirmar cuál de los dos debe mandar en vez de descubrirlo por accidente.

## Nota sobre los workflows inactivos

El ID sigue apareciendo en `ChatBot AhumadaDetialing`, `WA Reminders` y
`My Sub-workflow`. Los tres están **inactivos**, y en los dos primeros el ID es
legítimo (son workflows del propio Ahumada). No representan riesgo.
