# Prioridad 2 — Cerrar el flujo comercial de Ahumada Detailing

## Objetivo

Cerrar el ciclo comercial completo después de cotizar y agendar, agregando acciones para:

6. `cancel_booking` (COMPLETADO) 29-04-2026  
7. `reschedule_booking` (COMPLETADO) 29-04-2026 
8. `collect_address`
9. `confirm_address`
10. `send_pre_service_instructions`
11. `notify_on_the_way`
12. `request_review`
13. `request_referral`

La idea es que el bot no solo cotice y reserve, sino que también pueda manejar cancelaciones, reprogramaciones, dirección del servicio, preparación previa, aviso de camino, reseña y referidos.

---

# 1. Principio de implementación

Estas acciones deben agregarse de forma modular al `action_executor`, pero algunas también deben existir como reglas o followups.

## Separación correcta

| Parte del sistema | Qué hace |
|---|---|
| `rules_engine` | Detecta intención directa: cancelar, reprogramar, confirmar dirección, etc. |
| `context_builder` | Agrega acciones permitidas según estado del lead. |
| `llm_decision` | Solo elige una acción válida y redacta mensaje si hace falta. |
| `action_executor` | Ejecuta la acción real, actualiza BD, envía mensaje y registra auditoría. |
| `followup_scheduler` | Dispara acciones automáticas programadas: instrucciones, recordatorios, reseña, referidos. |

## Regla general

Nunca ejecutes una acción si falta información crítica.

Ejemplo:

- No cancelar si no existe reserva activa.
- No reprogramar si no hay nuevo slot validado.
- No pedir reseña si no hubo servicio.
- No mandar “voy en camino” si la cita está cancelada o no hay dirección.

---

# 2. Cambios globales antes de crear las acciones

Antes de crear cada acción, hay que preparar el sistema.

---

## 2.1. Ampliar whitelist de acciones en `validate_action`

Agregar estas acciones al arreglo `globalAllowedActions`:

```js
const globalAllowedActions = [
  "ask_missing_data",
  "send_quote",
  "answer_question",
  "answer_objection",
  "offer_booking",
  "offer_available_slots",
  "confirm_booking",
  "schedule_followup",
  "handoff_human",

  // Prioridad 2
  "cancel_booking",
  "reschedule_booking",
  "collect_address",
  "confirm_address",
  "send_pre_service_instructions",
  "notify_on_the_way",
  "request_review",
  "request_referral"
];
```

---

## 2.2. Ampliar el `action_router`

Actualmente el `action_router` debe pasar de 9 salidas a 17 salidas.

Mapa recomendado:

```js
({
  ask_missing_data: 0,
  send_quote: 1,
  answer_question: 2,
  answer_objection: 3,
  offer_booking: 4,
  confirm_booking: 5,
  schedule_followup: 6,
  handoff_human: 7,
  offer_available_slots: 8,

  cancel_booking: 9,
  reschedule_booking: 10,
  collect_address: 11,
  confirm_address: 12,
  send_pre_service_instructions: 13,
  notify_on_the_way: 14,
  request_review: 15,
  request_referral: 16
})[$json.decision.action]
```

En el nodo Switch:

- `numberOutputs`: `17`
- Cada salida nueva debe conectarse a su rama correspondiente.

---

## 2.3. Ampliar `build_action_requirements`

Agregar requisitos mínimos por acción.

```js
const requiredByAction = {
  ask_missing_data: ["lead_id", "channel", "message"],
  send_quote: ["lead_id", "channel", "service_interest", "vehicle_type", "district"],
  answer_question: ["lead_id", "channel", "message"],
  answer_objection: ["lead_id", "channel", "message"],
  offer_booking: ["lead_id", "channel", "message", "service_interest"],

  offer_available_slots: [
    "lead_id",
    "channel",
    "service_interest",
    "vehicle_type",
    "district"
  ],

  confirm_booking: [
    "lead_id",
    "channel",
    "service_interest",
    "vehicle_type",
    "district",
    "booking_date",
    "booking_time"
  ],

  schedule_followup: ["lead_id", "followup_type", "scheduled_for"],
  handoff_human: ["lead_id", "handoff_reason"],

  // Prioridad 2
  cancel_booking: ["lead_id", "channel"],
  reschedule_booking: ["lead_id", "channel"],
  collect_address: ["lead_id", "channel"],
  confirm_address: ["lead_id", "channel", "address"],
  send_pre_service_instructions: ["lead_id", "channel"],
  notify_on_the_way: ["lead_id", "channel"],
  request_review: ["lead_id", "channel"],
  request_referral: ["lead_id", "channel"]
};
```

Importante:

- `reschedule_booking` parte con pocos requisitos porque puede tener dos caminos:
  - si no hay nuevo horario, debe pedir/listar horarios;
  - si ya hay nuevo horario, debe validar slot y reprogramar.
- `cancel_booking` no exige `event_id` directamente porque el sistema debe buscar la reserva activa en BD.
- `send_pre_service_instructions`, `notify_on_the_way`, `request_review` y `request_referral` deben buscar la cita activa o reciente desde `appointments`.

---

## 2.4. Ampliar `build_execution_context`

Agregar estos campos al `execution_context`:

```js
address: firstValue(
  stateUpdate.address,
  state.address,
  ruleContext.address_candidate?.address
),

address_reference: firstValue(
  stateUpdate.address_reference,
  state.address_reference,
  ruleContext.address_candidate?.address_reference
),

address_confirmed:
  stateUpdate.address_confirmed ??
  state.address_confirmed ??
  ruleContext.address_candidate?.address_confirmed ??
  null,

cancellation_reason: firstValue(
  data.decision?.cancellation_reason,
  stateUpdate.cancellation_reason,
  ruleContext.cancellation_reason
),

reschedule_reason: firstValue(
  data.decision?.reschedule_reason,
  stateUpdate.reschedule_reason,
  ruleContext.reschedule_reason
),

eta_minutes: firstValue(
  data.decision?.eta_minutes,
  stateUpdate.eta_minutes,
  15
),

review_link: firstValue(
  data.decision?.review_link,
  state.review_link,
  "LINK_DE_RESEÑA_GOOGLE"
),

referral_offer: firstValue(
  data.decision?.referral_offer,
  state.referral_offer,
  null
)
```

---

## 2.5. Ampliar campos recomendados de BD

### Tabla `lead_state`

Agregar si no existen:

```sql
ALTER TABLE public.lead_state
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS address_reference text,
ADD COLUMN IF NOT EXISTS address_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS address_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS reschedule_reason text,
ADD COLUMN IF NOT EXISTS last_appointment_event_id text;
```

### Tabla `appointments`

Agregar si no existen:

```sql
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_address text,
ADD COLUMN IF NOT EXISTS address_reference text,
ADD COLUMN IF NOT EXISTS address_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS cancel_reason text,
ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS rescheduled_from_event_id text,
ADD COLUMN IF NOT EXISTS pre_service_instructions_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS on_the_way_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS review_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS referral_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;
```

Estados recomendados para `appointments.status`:

```text
pending
confirmed
cancelled
rescheduled
completed
no_show
```

### Tabla `followups`

Tipos nuevos recomendados:

```text
pre_service_instructions_24h
appointment_reminder_1h
notify_on_the_way_30m
post_service_review_24h
post_service_referral_72h
```

---

# 3. Cambios en `context_builder` y acciones permitidas por estado

Para que el LLM no invente acciones, el `context_builder` debe permitirlas según estado.

## Estado `booked`

Acciones permitidas:

```json
[
  "answer_question",
  "cancel_booking",
  "reschedule_booking",
  "collect_address",
  "confirm_address",
  "send_pre_service_instructions",
  "notify_on_the_way",
  "handoff_human"
]
```

## Estado `reschedule`

Acciones permitidas:

```json
[
  "offer_available_slots",
  "reschedule_booking",
  "cancel_booking",
  "answer_question",
  "handoff_human"
]
```

## Estado `post_service`

Acciones permitidas:

```json
[
  "request_review",
  "request_referral",
  "answer_question",
  "handoff_human"
]
```

## Estado `quoted` o `closing`

Acciones permitidas adicionales:

```json
[
  "offer_booking",
  "offer_available_slots",
  "answer_question",
  "answer_objection",
  "handoff_human"
]
```

---

# 4. Acción 6 — `cancel_booking`

## Propósito

Cancelar una reserva activa del cliente, actualizar la base de datos, cancelar followups pendientes y avisar al cliente.

---

## Cuándo se usa

Cuando el usuario dice algo como:

- “quiero cancelar”
- “cancela la hora”
- “ya no podré”
- “mejor dejémoslo”
- “no quiero el servicio”

---

## Datos que necesita

| Campo | Obligatorio | Fuente |
|---|---:|---|
| `lead_id` | Sí | `execution_context` |
| `channel` | Sí | `execution_context` |
| `cancellation_reason` | No | Mensaje usuario / LLM / rules |
| `appointment` activa | Sí | BD `appointments` |

---

## Etapa 1 — Buscar reserva activa

Crear nodo Postgres: `DB_Check_Active_Appointment_For_Cancel`

Query:

```sql
SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  status
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND status IN ('confirmed', 'pending')
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
```

---

## Etapa 2 — IF existe reserva

Nodo: `IF active_appointment_exists`

Condición:

```js
{{ !!$json.id }}
```

### Si NO existe

Responder:

```text
No encontré una reserva activa a tu nombre. Si quieres, puedo ayudarte a agendar una nueva.
```

Actualizar estado:

```json
{
  "last_bot_action": "cancel_booking_no_active_appointment",
  "next_goal": "offer_booking"
}
```

---

## Etapa 3 — Cancelar en Calendar

Crear subworkflow recomendado:

```text
6.5 cancel_calendar_booking
```

Entrada:

```json
{
  "calendar_id": "={{ $json.execution_context.calendar_id }}",
  "event_id": "={{ $json.event_id }}",
  "lead_id": "={{ $json.execution_context.lead_id }}"
}
```

Qué debe hacer:

- Buscar evento en Google Calendar.
- Cancelarlo o eliminarlo.
- Devolver `calendar_cancelled = true`.
- Si falla, devolver `error = true`.

---

## Etapa 4 — Actualizar appointment

Nodo Postgres: `DB_Update_Appointment_Cancelled`

```sql
UPDATE public.appointments
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancel_reason = NULLIF('{{ ($json.execution_context.cancellation_reason || "cancelled_by_client").replace(/'/g, "''") }}', '')
WHERE id = '{{ $json.id }}'
RETURNING *;
```

---

## Etapa 5 — Cancelar followups pendientes de esa cita

Nodo Postgres: `DB_Cancel_Appointment_Followups`

```sql
UPDATE public.followups
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  skipped_reason = 'appointment_cancelled'
WHERE lead_id = '{{ $json.execution_context.lead_id }}'
  AND status = 'pending'
  AND (
    metadata->>'appointment_event_id' = '{{ $json.event_id }}'
    OR followup_type IN (
      'appointment_reminder_1d',
      'appointment_reminder_1h',
      'pre_service_instructions_24h',
      'notify_on_the_way_30m',
      'post_service_review_24h',
      'post_service_referral_72h'
    )
  );
```

---

## Etapa 6 — Crear mensaje de confirmación

Nodo Code: `build_cancel_booking_message`

```js
return [{
  ...$json,
  message_to_send: "Listo, dejé cancelada tu reserva. Si más adelante quieres reagendar, me escribes y revisamos un nuevo horario.",
  db_operations: ["appointments", "followups", "messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "cancelled",
    next_goal: "reactivate_later",
    last_bot_action: "cancel_booking",
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "booking_cancelled"
  ]
}];
```

Conectar a `IF requires_message`.

---

## Qué debe tener para considerarlo listo

- Valida que exista reserva activa.
- No cancela citas pasadas.
- Cancela o actualiza Calendar.
- Marca appointment como `cancelled`.
- Cancela followups pendientes.
- Envía mensaje.
- Actualiza `lead_state`.
- Es idempotente: si el usuario repite “cancelar”, no duplica operación.

---

## Pruebas mínimas

1. Cliente con reserva activa cancela.
2. Cliente sin reserva intenta cancelar.
3. Cliente cancela dos veces.
4. Falla Calendar pero existe appointment.
5. Se verifica que followups queden cancelados.

---

# 5. Acción 7 — `reschedule_booking`

## Propósito

Cambiar una reserva activa a un nuevo horario, validando disponibilidad real antes de modificar Calendar y BD.

---

## Cuándo se usa

Cuando el usuario dice:

- “quiero cambiar la hora”
- “puedo otro día?”
- “mejor la próxima semana”
- “reagendemos”
- “ese horario no me sirve”

---

## Datos que necesita

| Campo | Obligatorio | Comentario |
|---|---:|---|
| `lead_id` | Sí | Siempre |
| `channel` | Sí | Siempre |
| reserva activa | Sí | Se busca en BD |
| nuevo horario | Depende | Si falta, se ofrecen opciones |
| `booking_date` | Solo si ya eligió horario | |
| `booking_time` | Solo si ya eligió horario | |
| `slot_id` | Recomendado | |
| `availability_confirmed` | Sí para ejecutar cambio | Debe venir de `6.2 check_calendar_slot` |

---

## Etapa 1 — Buscar reserva activa

Nodo: `DB_Check_Active_Appointment_For_Reschedule`

```sql
SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  status
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND status IN ('confirmed', 'pending')
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
```

---

## Etapa 2 — Si no hay reserva activa

Mensaje:

```text
No encontré una reserva activa para reprogramar. Si quieres, puedo ayudarte a agendar una nueva.
```

Estado:

```json
{
  "last_bot_action": "reschedule_no_active_appointment",
  "next_goal": "offer_booking"
}
```

---

## Etapa 3 — Si no hay nuevo horario

Si el usuario pide reprogramar pero no indica fecha/hora, no cambies nada todavía.

Acción recomendada:

- `state.stage = "reschedule"`
- `next_goal = "collect_new_slot"`
- llamar a `offer_available_slots`

Mensaje:

```text
Claro, podemos reprogramar. Te comparto horarios disponibles para que elijas uno nuevo.
```

Flujo:

```text
reschedule_booking
  -> si falta booking_date / booking_time
  -> offer_available_slots
  -> usuario elige opción
  -> reschedule_booking nuevamente
```

---

## Etapa 4 — Validar nuevo slot

Usar tu subworkflow actual:

```text
6.2 check_calendar_slot
```

Entrada:

```json
{
  "lead_id": "={{ $json.execution_context.lead_id }}",
  "slot_id": "={{ $json.execution_context.slot_id }}",
  "booking_date": "={{ $json.execution_context.booking_date }}",
  "booking_time": "={{ $json.execution_context.booking_time }}",
  "duration_minutes": "={{ String($json.execution_context.duration_minutes || 120) }}",
  "calendar_id": "={{ $json.execution_context.calendar_id }}"
}
```

Si `slot_available = false`, responder:

```text
Ese horario ya no está disponible. Te puedo proponer otro.
```

---

## Etapa 5 — Actualizar Calendar

Crear subworkflow recomendado:

```text
6.6 reschedule_calendar_booking
```

Entrada:

```json
{
  "calendar_id": "={{ $json.execution_context.calendar_id }}",
  "old_event_id": "={{ $json.active_appointment.event_id }}",
  "new_start_at": "={{ $json.slot_start_at }}",
  "new_end_at": "={{ $json.slot_end_at }}",
  "lead_id": "={{ $json.execution_context.lead_id }}",
  "service_interest": "={{ $json.execution_context.service_interest }}",
  "vehicle_type": "={{ $json.execution_context.vehicle_type }}",
  "district": "={{ $json.execution_context.district }}"
}
```

Recomendación técnica:

- Opción A: actualizar el evento existente.
- Opción B: cancelar el evento anterior y crear uno nuevo.

Para debugging es más claro usar opción B:

1. cancelar evento anterior;
2. crear nuevo evento;
3. guardar nuevo `event_id`;
4. marcar appointment anterior como `rescheduled`.

---

## Etapa 6 — Actualizar appointments

Si se crea un nuevo evento:

```sql
UPDATE public.appointments
SET
  status = 'rescheduled',
  rescheduled_at = NOW()
WHERE id = '{{ $json.active_appointment.id }}';
```

Luego insertar nueva cita:

```sql
INSERT INTO public.appointments (
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  description,
  status,
  service_address,
  address_reference,
  rescheduled_from_event_id,
  created_at
)
VALUES (
  '{{ $json.new_calendar_event.id }}',
  '{{ $json.execution_context.lead_id }}',
  '{{ $json.slot_start_at }}',
  '{{ $json.slot_end_at }}',
  '{{ $json.summary || "Servicio Ahumada Detailing" }}',
  '{{ $json.description || "" }}',
  'confirmed',
  '{{ ($json.execution_context.address || "").replace(/'/g, "''") }}',
  '{{ ($json.execution_context.address_reference || "").replace(/'/g, "''") }}',
  '{{ $json.active_appointment.event_id }}',
  NOW()
)
RETURNING *;
```

---

## Etapa 7 — Cancelar followups antiguos y crear nuevos

Cancelar pendientes asociados al evento anterior:

```sql
UPDATE public.followups
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  skipped_reason = 'appointment_rescheduled'
WHERE lead_id = '{{ $json.execution_context.lead_id }}'
  AND status = 'pending'
  AND metadata->>'appointment_event_id' = '{{ $json.active_appointment.event_id }}';
```

Crear nuevos followups igual que en `confirm_booking`:

- `pre_service_instructions_24h`
- `appointment_reminder_1h`
- `post_service_review_24h`

---

## Etapa 8 — Mensaje de confirmación

```js
const start = new Date($json.new_appointment.start_at);

const fecha = start.toLocaleDateString("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "2-digit",
  month: "long"
});

const hora = start.toLocaleTimeString("es-CL", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  minute: "2-digit"
});

return [{
  ...$json,
  message_to_send: `Listo, tu reserva quedó reprogramada para el ${fecha} a las ${hora}.`,
  db_operations: ["appointments", "followups", "messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booked",
    next_goal: "pre_service_reminder",
    last_bot_action: "reschedule_booking",
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "booking_rescheduled"
  ]
}];
```

---

## Qué debe tener para considerarlo listo

- Detecta reserva activa.
- Si falta nuevo horario, ofrece opciones.
- Valida disponibilidad.
- Actualiza/cancela Calendar correctamente.
- No crea doble reserva.
- Cancela followups antiguos.
- Crea followups nuevos.
- Actualiza estado a `booked`.

---

## Pruebas mínimas

1. Cliente con reserva pide cambiar sin dar fecha.
2. Cliente elige nuevo horario válido.
3. Cliente elige horario no disponible.
4. Cliente sin reserva intenta reprogramar.
5. Reprogramación repetida no duplica citas.

---

# 6. Acción 8 — `collect_address`

## Propósito

Pedir la dirección exacta donde se realizará el servicio a domicilio.

---

## Cuándo se usa

Después de reservar si falta dirección, o cuando el servicio necesita ubicación exacta.

Ejemplos:

- Reserva confirmada pero `address` está vacío.
- Antes de enviar instrucciones previas.
- Antes de mandar “voy en camino”.

---

## Datos que necesita

| Campo | Obligatorio |
|---|---:|
| `lead_id` | Sí |
| `channel` | Sí |
| appointment activa | Recomendado |
| `address` | No, porque esta acción la pide |

---

## Etapa 1 — Validar si ya existe dirección

Si `lead_state.address` existe y `address_confirmed = true`, no preguntar de nuevo.

En ese caso, puedes avanzar a:

```text
send_pre_service_instructions
```

---

## Etapa 2 — Construir mensaje

Nodo Code: `collect_address`

```js
return [{
  ...$json,
  message_to_send:
    "Perfecto. Para coordinar el servicio a domicilio, ¿me compartes la dirección exacta? Si puedes, incluye calle, número, comuna y alguna referencia para llegar.",
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.execution_context.state_update || {}),
    stage: "booked",
    next_goal: "collect_address",
    last_bot_action: "collect_address",
    missing_fields: ["address"]
  }
}];
```

Conectar a `IF requires_message`.

---

## Etapa 3 — Guardar expectativa en `lead_state`

Debe dejar marcado que el próximo objetivo es recibir dirección:

```json
{
  "next_goal": "collect_address",
  "missing_fields": ["address"],
  "last_bot_action": "collect_address"
}
```

---

## Qué debe tener para considerarlo listo

- Pregunta dirección solo si falta.
- No repite la pregunta si ya está confirmada.
- Deja `missing_fields = ["address"]`.
- Mantiene `stage = booked`.

---

## Pruebas mínimas

1. Reserva confirmada sin dirección.
2. Reserva confirmada con dirección no confirmada.
3. Reserva confirmada con dirección ya confirmada.
4. Usuario responde dirección y el siguiente turno pasa a `confirm_address`.

---

# 7. Acción 9 — `confirm_address`

## Propósito

Guardar, confirmar y asociar la dirección al lead y a la cita activa.

---

## Cuándo se usa

Cuando el usuario entrega dirección o confirma que la dirección es correcta.

Ejemplos:

- “Av. Siempre Viva 123, Huechuraba”
- “Sí, esa es”
- “Correcto”
- “No, es esta otra dirección…”

---

## Dos casos posibles

### Caso A — Usuario entrega dirección nueva

El bot debe responder confirmando:

```text
Perfecto, tengo esta dirección: Av. Siempre Viva 123, Huechuraba. ¿Está correcta?
```

Estado:

```json
{
  "address": "Av. Siempre Viva 123, Huechuraba",
  "address_confirmed": false,
  "next_goal": "confirm_address",
  "last_bot_action": "confirm_address_pending"
}
```

### Caso B — Usuario confirma dirección

El bot debe marcarla como confirmada:

```json
{
  "address_confirmed": true,
  "address_confirmed_at": "NOW()",
  "next_goal": "pre_service_reminder",
  "last_bot_action": "confirm_address"
}
```

---

## Datos que necesita

| Campo | Obligatorio | Comentario |
|---|---:|---|
| `lead_id` | Sí | |
| `channel` | Sí | |
| `address` | Sí | Dirección detectada o ya guardada |
| appointment activa | Recomendado | Para guardar dirección en la cita |

---

## Etapa 1 — Validar dirección mínima

La dirección debe tener al menos:

- calle o avenida;
- número o referencia útil;
- comuna.

Si viene muy vaga, responder:

```text
Gracias. ¿Me puedes enviar la dirección un poco más completa? Idealmente calle, número, comuna y una referencia.
```

---

## Etapa 2 — Actualizar `lead_state`

Query recomendada:

```sql
UPDATE public.lead_state
SET
  address = NULLIF('{{ ($json.execution_context.address || "").replace(/'/g, "''") }}', ''),
  address_reference = NULLIF('{{ ($json.execution_context.address_reference || "").replace(/'/g, "''") }}', ''),
  address_confirmed = {{ $json.execution_context.address_confirmed === true ? 'true' : 'false' }},
  address_confirmed_at = CASE
    WHEN {{ $json.execution_context.address_confirmed === true ? 'true' : 'false' }}
    THEN NOW()
    ELSE address_confirmed_at
  END,
  missing_fields = '[]'::jsonb,
  last_bot_action = 'confirm_address',
  next_goal = 'pre_service_reminder',
  updated_at = NOW()
WHERE lead_id = '{{ $json.execution_context.lead_id }}';
```

---

## Etapa 3 — Actualizar cita activa

```sql
UPDATE public.appointments
SET
  service_address = NULLIF('{{ ($json.execution_context.address || "").replace(/'/g, "''") }}', ''),
  address_reference = NULLIF('{{ ($json.execution_context.address_reference || "").replace(/'/g, "''") }}', ''),
  address_confirmed_at = CASE
    WHEN {{ $json.execution_context.address_confirmed === true ? 'true' : 'false' }}
    THEN NOW()
    ELSE address_confirmed_at
  END
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND status = 'confirmed'
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
```

Si Postgres no permite `ORDER BY LIMIT` directo en `UPDATE`, usa subquery:

```sql
UPDATE public.appointments
SET
  service_address = NULLIF('{{ ($json.execution_context.address || "").replace(/'/g, "''") }}', ''),
  address_reference = NULLIF('{{ ($json.execution_context.address_reference || "").replace(/'/g, "''") }}', ''),
  address_confirmed_at = NOW()
WHERE id = (
  SELECT id
  FROM public.appointments
  WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
    AND status = 'confirmed'
    AND start_at >= NOW()
  ORDER BY start_at ASC
  LIMIT 1
);
```

---

## Etapa 4 — Mensaje

Si solo está pidiendo confirmación:

```text
Perfecto, tengo esta dirección: {address}. ¿Está correcta?
```

Si ya quedó confirmada:

```text
Perfecto, dirección confirmada. Antes del servicio te enviaré las indicaciones para tener todo listo.
```

---

## Qué debe tener para considerarlo listo

- Guarda dirección en `lead_state`.
- Guarda dirección en `appointments`.
- Diferencia entre dirección recibida y dirección confirmada.
- No avanza a instrucciones si dirección sigue dudosa.
- Permite corregir dirección.

---

## Pruebas mínimas

1. Usuario entrega dirección completa.
2. Usuario entrega dirección incompleta.
3. Usuario confirma dirección.
4. Usuario corrige dirección.
5. Dirección queda asociada a appointment activo.

---

# 8. Acción 10 — `send_pre_service_instructions`

## Propósito

Enviar instrucciones antes del servicio para evitar problemas operativos y preparar al cliente.

---

## Cuándo se usa

Idealmente:

- 24 horas antes del servicio;
- o justo después de confirmar dirección si la cita es pronto;
- solo si la cita está confirmada.

---

## Datos que necesita

| Campo | Obligatorio |
|---|---:|
| `lead_id` | Sí |
| `channel` | Sí |
| appointment confirmada | Sí |
| `start_at` | Sí |
| `service_address` o `address` | Recomendado |
| `service_interest` | Recomendado |

---

## Etapa 1 — Buscar cita activa próxima

```sql
SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  summary,
  service_address,
  address_reference,
  pre_service_instructions_sent_at,
  status
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND status = 'confirmed'
  AND start_at >= NOW()
ORDER BY start_at ASC
LIMIT 1;
```

---

## Etapa 2 — Validaciones

No enviar si:

- no existe cita;
- cita cancelada;
- ya se envió `pre_service_instructions_sent_at`;
- `human_handoff = true`;
- falta dirección crítica y el servicio es a domicilio.

Si falta dirección, derivar a:

```text
collect_address
```

---

## Etapa 3 — Mensaje recomendado

```text
Te dejo las indicaciones para el servicio:

1. Dejar el vehículo en un lugar con espacio para trabajar.
2. Retirar objetos personales de valor.
3. Si el estacionamiento tiene acceso restringido, avisarme cómo ingresar.
4. Si hay una referencia para llegar, me la puedes dejar escrita por aquí.
5. El servicio tiene una duración aproximada de 2 horas.

Cualquier cambio de horario me avisas con anticipación.
```

Versión más natural:

```text
Perfecto, te dejo unas indicaciones para mañana: idealmente deja el auto en un lugar con espacio para trabajar, retira objetos personales de valor y avísame si el acceso al estacionamiento tiene alguna indicación especial. El servicio dura aprox. 2 horas.
```

---

## Etapa 4 — Actualizar appointment

```sql
UPDATE public.appointments
SET pre_service_instructions_sent_at = NOW()
WHERE id = '{{ $json.id }}';
```

---

## Etapa 5 — Estado

```json
{
  "stage": "booked",
  "next_goal": "service_execution",
  "last_bot_action": "send_pre_service_instructions"
}
```

---

## Qué debe tener para considerarlo listo

- Se dispara por followup o acción directa.
- No se repite si ya fue enviado.
- No se envía si la cita fue cancelada.
- Si falta dirección, primero pide dirección.
- Deja trazabilidad en `appointments`.

---

## Pruebas mínimas

1. Cita mañana con dirección confirmada.
2. Cita sin dirección.
3. Cita cancelada.
4. Instrucciones ya enviadas.
5. Lead en handoff humano.

---

# 9. Acción 11 — `notify_on_the_way`

## Propósito

Avisar al cliente que ya vas en camino o que estás próximo a llegar.

---

## Cuándo se usa

Puede dispararse de dos formas:

1. Manual: tú presionas un botón o envías un comando interno.
2. Automática: 30 a 60 minutos antes del servicio.

Recomendación: partir manual o semi-automático, porque “voy en camino” depende de la operación real.

---

## Datos que necesita

| Campo | Obligatorio |
|---|---:|
| `lead_id` | Sí |
| `channel` | Sí |
| appointment confirmada | Sí |
| dirección confirmada | Recomendado |
| `eta_minutes` | Opcional, default 15 |

---

## Etapa 1 — Buscar cita de hoy

```sql
SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  service_address,
  on_the_way_sent_at,
  status
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND status = 'confirmed'
  AND start_at::date = CURRENT_DATE
ORDER BY start_at ASC
LIMIT 1;
```

---

## Etapa 2 — Validaciones

No enviar si:

- no hay cita hoy;
- la cita está cancelada;
- ya se envió `on_the_way_sent_at`;
- no hay dirección suficiente;
- faltan más de varias horas para la cita, salvo disparo manual.

---

## Etapa 3 — Mensaje

```js
const eta = $json.execution_context?.eta_minutes || 15;

return [{
  ...$json,
  message_to_send: `Voy en camino. Debería llegar aproximadamente en ${eta} minutos.`,
  db_operations: ["messages", "appointments", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booked",
    next_goal: "complete_service",
    last_bot_action: "notify_on_the_way"
  },
  notes: [
    ...($json.notes || []),
    "on_the_way_sent"
  ]
}];
```

---

## Etapa 4 — Actualizar appointment

```sql
UPDATE public.appointments
SET on_the_way_sent_at = NOW()
WHERE id = '{{ $json.id }}';
```

---

## Qué debe tener para considerarlo listo

- Busca cita de hoy.
- Evita duplicados.
- No manda aviso a citas canceladas.
- Permite ETA.
- Actualiza `appointments.on_the_way_sent_at`.

---

## Pruebas mínimas

1. Cita hoy, mensaje enviado.
2. Cita mañana, no enviar automático.
3. Cita cancelada.
4. Aviso ya enviado.
5. Sin dirección confirmada.

---

# 10. Acción 12 — `request_review`

## Propósito

Pedir reseña después del servicio para aumentar reputación y prueba social.

---

## Cuándo se usa

Después del servicio, idealmente:

- 2 a 24 horas después;
- o cuando appointment esté marcado como `completed`.

---

## Datos que necesita

| Campo | Obligatorio |
|---|---:|
| `lead_id` | Sí |
| `channel` | Sí |
| appointment completada o pasada | Sí |
| `review_link` | Sí, puede venir fijo desde config |

---

## Etapa 1 — Buscar cita completada o reciente

```sql
SELECT
  id,
  event_id,
  conversation_id,
  start_at,
  end_at,
  status,
  review_requested_at
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND (
    status = 'completed'
    OR end_at <= NOW()
  )
ORDER BY end_at DESC
LIMIT 1;
```

---

## Etapa 2 — Validaciones

No pedir reseña si:

- no existe cita pasada;
- la cita fue cancelada;
- ya se pidió reseña;
- el cliente tuvo reclamo o handoff delicado;
- el servicio no fue completado.

---

## Etapa 3 — Mensaje

```text
Muchas gracias por confiar en Ahumada Detailing. Si quedaste conforme con el servicio, me ayudaría mucho que dejaras una reseña aquí: {review_link}
```

Versión más cercana:

```text
Gracias por confiar en Ahumada Detailing. Si te gustó el resultado, me ayudaría muchísimo que me dejaras una reseña acá: {review_link}
```

---

## Etapa 4 — Actualizar appointment

```sql
UPDATE public.appointments
SET review_requested_at = NOW()
WHERE id = '{{ $json.id }}';
```

---

## Etapa 5 — Programar referido

Después de pedir reseña, puedes crear un followup para referidos:

```sql
INSERT INTO public.followups (
  lead_id,
  followup_type,
  message_template_key,
  scheduled_for,
  status,
  metadata,
  dedupe_key,
  created_at
)
VALUES (
  '{{ $json.execution_context.lead_id }}'::uuid,
  'post_service_referral_72h',
  'post_service_referral_72h',
  NOW() + interval '72 hours',
  'pending',
  jsonb_build_object(
    'source', 'request_review',
    'appointment_event_id', '{{ $json.event_id }}'
  ),
  '{{ $json.execution_context.lead_id }}__post_service_referral_72h__{{ $json.event_id }}',
  NOW()
)
ON CONFLICT (dedupe_key) DO NOTHING;
```

---

## Estado

```json
{
  "stage": "post_service",
  "next_goal": "request_referral",
  "last_bot_action": "request_review"
}
```

---

## Qué debe tener para considerarlo listo

- Solo pide reseña después del servicio.
- No se repite.
- Usa link real de Google Review.
- Puede programar referido posterior.
- Queda registrado en appointment.

---

## Pruebas mínimas

1. Servicio completado.
2. Servicio cancelado.
3. Servicio aún no realizado.
4. Reseña ya solicitada.
5. Followup de referido creado.

---

# 11. Acción 13 — `request_referral`

## Propósito

Pedir referidos después de un servicio exitoso.

---

## Cuándo se usa

Después de:

- pedir reseña;
- confirmar satisfacción;
- o 48 a 72 horas después del servicio.

No conviene pedir referido antes de la reseña ni si hubo reclamo.

---

## Datos que necesita

| Campo | Obligatorio |
|---|---:|
| `lead_id` | Sí |
| `channel` | Sí |
| appointment completada | Sí |
| `referral_offer` | Opcional |

---

## Etapa 1 — Buscar cita completada reciente

```sql
SELECT
  id,
  event_id,
  conversation_id,
  end_at,
  status,
  referral_requested_at,
  review_requested_at
FROM public.appointments
WHERE conversation_id = '{{ $json.execution_context.lead_id }}'
  AND (
    status = 'completed'
    OR end_at <= NOW()
  )
ORDER BY end_at DESC
LIMIT 1;
```

---

## Etapa 2 — Validaciones

No pedir referido si:

- no hubo servicio;
- la cita fue cancelada;
- ya se pidió referido;
- hubo reclamo o handoff;
- el cliente no respondió bien al post-servicio.

---

## Etapa 3 — Mensaje

Sin beneficio explícito:

```text
Si conoces a alguien que quiera dejar su auto impecable, me ayudaría mucho que le compartas mi contacto. Trabajo a domicilio y puedo orientarlo por WhatsApp.
```

Con beneficio:

```text
Si conoces a alguien que quiera un lavado premium a domicilio, me ayudaría mucho que le compartas mi contacto. Si agenda de tu parte, puedo dejarte un beneficio para tu próximo servicio.
```

---

## Etapa 4 — Actualizar appointment

```sql
UPDATE public.appointments
SET referral_requested_at = NOW()
WHERE id = '{{ $json.id }}';
```

---

## Estado

```json
{
  "stage": "post_service",
  "next_goal": "reactivation",
  "last_bot_action": "request_referral"
}
```

---

## Qué debe tener para considerarlo listo

- Se envía solo después de servicio.
- No se repite.
- No se manda si hubo mala experiencia.
- Puede usar oferta de referido.
- Queda registrado.

---

## Pruebas mínimas

1. Servicio completado y reseña ya solicitada.
2. Servicio completado sin reseña solicitada.
3. Servicio cancelado.
4. Referido ya solicitado.
5. Cliente con reclamo/handoff.

---

# 12. Orden recomendado de implementación

Para no romper el flujo actual, implementa en este orden:

## Fase 1 — Base de agenda

1. Agregar columnas a BD.
2. Agregar acciones a `globalAllowedActions`.
3. Agregar outputs al `action_router`.
4. Agregar requisitos en `build_action_requirements`.
5. Agregar campos en `build_execution_context`.

---

## Fase 2 — Acciones críticas de agenda

6. Crear `cancel_booking`.
7. Crear `reschedule_booking`.

Estas dos son críticas porque evitan que el bot quede bloqueado cuando el cliente cambia o cancela.

---

## Fase 3 — Dirección del servicio

8. Crear `collect_address`.
9. Crear `confirm_address`.

Estas deben quedar antes de instrucciones previas y antes de “voy en camino”.

---

## Fase 4 — Automatización operacional

10. Crear `send_pre_service_instructions`.
11. Crear `notify_on_the_way`.

Estas acciones conectan lo comercial con la operación real del servicio.

---

## Fase 5 — Post-servicio

12. Crear `request_review`.
13. Crear `request_referral`.

Estas acciones aumentan prueba social y nuevos clientes.

---

# 13. Cambios necesarios en `followup_scheduler`

Agregar procesamiento para estos tipos:

```text
pre_service_instructions_24h
notify_on_the_way_30m
post_service_review_24h
post_service_referral_72h
```

## Reglas del scheduler

Antes de ejecutar cualquier followup:

```sql
SELECT
  f.*,
  ls.human_handoff,
  ls.stage,
  a.status AS appointment_status
FROM public.followups f
LEFT JOIN public.lead_state ls ON ls.lead_id = f.lead_id
LEFT JOIN public.appointments a ON a.event_id = f.metadata->>'appointment_event_id'
WHERE f.status = 'pending'
  AND f.scheduled_for <= NOW()
  AND COALESCE(ls.human_handoff, false) = false
  AND (
    a.status IS NULL
    OR a.status NOT IN ('cancelled', 'rescheduled', 'no_show')
  );
```

Luego mapear:

| `followup_type` | Acción a ejecutar |
|---|---|
| `pre_service_instructions_24h` | `send_pre_service_instructions` |
| `notify_on_the_way_30m` | `notify_on_the_way` |
| `post_service_review_24h` | `request_review` |
| `post_service_referral_72h` | `request_referral` |

---

# 14. Cambios en `llm_decision`

Actualizar el enum/schema de acciones permitidas:

```json
[
  "ask_missing_data",
  "send_quote",
  "answer_question",
  "answer_objection",
  "offer_booking",
  "offer_available_slots",
  "confirm_booking",
  "schedule_followup",
  "handoff_human",
  "cancel_booking",
  "reschedule_booking",
  "collect_address",
  "confirm_address",
  "send_pre_service_instructions",
  "notify_on_the_way",
  "request_review",
  "request_referral"
]
```

## Instrucción importante para el prompt

Agregar:

```text
Si el usuario quiere cancelar una reserva, usa cancel_booking.
Si el usuario quiere cambiar fecha u hora, usa reschedule_booking.
Si la reserva está confirmada pero falta dirección, usa collect_address.
Si el usuario entrega dirección, usa confirm_address.
Si el servicio ya fue realizado y corresponde pedir reseña, usa request_review.
Si ya se pidió reseña o el cliente quedó conforme, usa request_referral.
No inventes acciones fuera del enum.
No ejecutes más de una acción principal por turno.
```

---

# 15. Cambios en `rules_engine`

El `rules_engine` debe detectar directamente:

## Cancelación

Si texto contiene intención de cancelar:

```json
{
  "resolution_type": "rule_based",
  "action": "cancel_booking",
  "reason": "user_requested_cancellation"
}
```

## Reprogramación

Si texto contiene intención de cambiar horario:

```json
{
  "resolution_type": "rule_based",
  "action": "reschedule_booking",
  "reason": "user_requested_reschedule"
}
```

## Dirección

Si `next_goal = collect_address` y el usuario envía una dirección:

```json
{
  "resolution_type": "rule_based",
  "action": "confirm_address",
  "state_update": {
    "address": "dirección detectada",
    "address_confirmed": false
  }
}
```

## Confirmación de dirección

Si `next_goal = confirm_address` y usuario dice “sí”, “correcto”, “está bien”:

```json
{
  "resolution_type": "rule_based",
  "action": "confirm_address",
  "state_update": {
    "address_confirmed": true
  }
}
```

---

# 16. Resultado esperado al terminar Prioridad 2

Cuando esté terminado, el flujo comercial debería poder hacer esto:

1. Cliente consulta.
2. Bot califica.
3. Bot cotiza.
4. Bot ofrece horarios.
5. Bot agenda.
6. Bot pide dirección.
7. Bot confirma dirección.
8. Bot envía instrucciones previas.
9. Bot avisa “voy en camino”.
10. Bot marca/gestiona post-servicio.
11. Bot pide reseña.
12. Bot pide referido.
13. Si el cliente cancela o reprograma, el sistema lo maneja sin intervención manual.

---

# 17. Checklist final

## Configuración

- [ ] `globalAllowedActions` actualizado.
- [ ] `action_router` con 17 outputs.
- [ ] `build_action_requirements` actualizado.
- [ ] `build_execution_context` actualizado.
- [ ] `llm_decision` schema actualizado.
- [ ] `context_builder` allowed_actions por estado actualizado.
- [ ] `rules_engine` detecta cancelación/reprogramación/dirección.

## BD

- [ ] `lead_state` tiene campos de dirección.
- [ ] `appointments` tiene campos de operación/post-servicio.
- [ ] `followups` soporta tipos nuevos.
- [ ] Hay índices o dedupe para evitar duplicados.

## Acciones

- [ ] `cancel_booking` listo.
- [ ] `reschedule_booking` listo.
- [ ] `collect_address` listo.
- [ ] `confirm_address` listo.
- [ ] `send_pre_service_instructions` listo.
- [ ] `notify_on_the_way` listo.
- [ ] `request_review` listo.
- [ ] `request_referral` listo.

## Pruebas completas

- [ ] Cancelar reserva activa.
- [ ] Cancelar sin reserva.
- [ ] Reprogramar con horario nuevo.
- [ ] Reprogramar sin horario nuevo.
- [ ] Confirmar dirección.
- [ ] Corregir dirección.
- [ ] Enviar instrucciones.
- [ ] Enviar voy en camino.
- [ ] Pedir reseña post-servicio.
- [ ] Pedir referido.
- [ ] Verificar que no se dupliquen mensajes ni followups.
- [ ] Verificar que no se ejecuten acciones si `human_handoff = true`.

---

# 18. Recomendación práctica

No implementes las 8 acciones al mismo tiempo en n8n.

Hazlo así:

1. Primero `cancel_booking`.
2. Luego `reschedule_booking`.
3. Después `collect_address` + `confirm_address`.
4. Luego `send_pre_service_instructions`.
5. Luego `notify_on_the_way`.
6. Finalmente `request_review` + `request_referral`.

Cada acción debe quedar probada antes de pasar a la siguiente.
