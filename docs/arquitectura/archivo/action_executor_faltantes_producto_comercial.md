# Revisión del Action Executor — Ramas de acción y producto comercial

## Contexto

Este documento resume qué falta en el workflow `6 action_executor` para considerarlo completo a nivel técnico, operativo y comercial dentro del proyecto **AI Closer en n8n**.

El Action Executor ya está bastante avanzado, pero todavía no debería considerarse un producto comercial completo. Actualmente se encuentra más cerca de un **MVP funcional avanzado**, con varias ramas importantes ya implementadas, pero con algunos cortes, validaciones incompletas y componentes que todavía deben desacoplarse para que sea vendible a distintos negocios.

---

# 1. Estado actual del Action Executor

El workflow ya contempla las principales acciones comerciales:

| Acción | Estado actual | Qué falta |
|---|---:|---|
| `ask_missing_data` | Casi lista | El fallback por requisitos faltantes debe enviar mensaje, no solo actualizar estado |
| `send_quote` | Parcial | Hay que corregir el flujo para que no inserte cotización si no encontró precio |
| `answer_question` | Bastante lista | Falta enriquecer respuestas con catálogo/servicios desde DB |
| `answer_objection` | Bastante lista | Falta lógica comercial de objeciones por tipo |
| `offer_booking` | Lista como invitación simple | Comercialmente debería empujar a `offer_available_slots` |
| `offer_available_slots` | Bastante bien | Falta asegurar que la selección “1, 2, 3” quede resuelta antes de confirmar |
| `confirm_booking` | Avanzada | Falta robustecer errores, reprogramación/cancelación y persistencia final |
| `schedule_followup` | Parcial | Inserta followup, pero puede perder contexto después del nodo DB |
| `handoff_human` | Avanzada | Falta validar que el humano fue notificado y que el caso quedó trazable |

---

# 2. Faltantes críticos antes de considerarlo completo

## A. Corregir el branch de `send_quote`

Este es uno de los puntos más importantes.

Actualmente el flujo llama a `resolve_pricing_from_db`, pero existe riesgo de que el flujo siga hacia `insert_quote` aunque el precio no haya sido encontrado.

Eso puede provocar:

- cotización con precio vacío
- error en base de datos
- mensaje de “no pude cotizar” y, al mismo tiempo, intento de guardar una cotización
- estados inconsistentes en `lead_state`
- followups creados para una cotización inválida

## Estructura recomendada

```text
send_quote
→ resolve_pricing_from_db
→ IF pricing_found
   true:
      merge pricing + context
      build_quote_message
      insert_quote status = pending_send
      send_outbound_message
      insert_message
      update_quote_status sent/failed
      update lead_state
      create quote followups
   false:
      build_pricing_unavailable_result
      send message
      update lead_state
      audit
```

## Acción concreta

El nodo `insert_quote` solo debe ejecutarse si:

```js
$json.success === true && !!$json.quote?.base_price
```

Si no hay precio, debe ir directamente a:

```text
build_pricing_unavailable_result
→ IF requires_message
```

---

## B. Corregir `build_missing_requirements_result`

Actualmente cuando falta un dato obligatorio, el flujo arma un `fallback_message`, por ejemplo:

```json
{
  "fallback_message": "Perfecto. ¿Qué tipo de vehículo tienes?"
}
```

Pero ese branch puede terminar solo actualizando estado, sin enviar el mensaje al cliente.

## Problema

Si falta un dato, el cliente debe recibir la pregunta. No basta con actualizar `lead_state`.

## Código recomendado

```js
const action = $json.validation?.action || null;
const missing_fields = $json.validation?.missing_fields || [];

let fallback_message = "Necesito un poco más de información para continuar.";

if (missing_fields.includes("district")) {
  fallback_message = "Perfecto. Para ayudarte bien, ¿en qué comuna estás?";
} else if (missing_fields.includes("vehicle_type")) {
  fallback_message = "Perfecto. ¿Qué tipo de vehículo tienes?";
} else if (missing_fields.includes("service_interest")) {
  fallback_message = "Perfecto. ¿Qué servicio te interesa?";
} else if (missing_fields.includes("booking_date")) {
  fallback_message = "Perfecto. ¿Para qué día te gustaría agendar?";
} else if (missing_fields.includes("booking_time")) {
  fallback_message = "Perfecto. ¿Qué horario te acomoda?";
}

return [{
  ...$json,
  message_to_send: fallback_message,
  db_operations: ["messages", "lead_state"],
  state_update: {
    missing_fields,
    last_bot_action: "ask_missing_data",
    next_goal: "collect_missing_data"
  },
  execution_result: {
    success: false,
    action,
    message_sent: false,
    state_updated: true,
    db_records_created: ["lead_state"],
    notes: [
      "blocked_missing_requirements",
      ...missing_fields
    ],
    fallback_action: "ask_missing_data",
    fallback_message
  }
}];
```

## Conexión recomendada

```text
build_missing_requirements_result
→ IF requires_message
```

No debe ir directo a `build_state_payload`.

---

## C. Conectar `build_slot_unavailable_result`

El branch de horario no disponible está construido, pero puede quedar como terminal si no se conecta al flujo general de envío.

## Problema

Si el horario ya no está disponible, el cliente debe recibir el mensaje:

```text
Ese horario ya no está disponible. Si quieres, te propongo otro.
```

## Conexión recomendada

```text
build_slot_unavailable_result
→ IF requires_message
```

---

## D. Preservar `message_sent` después de enviar WhatsApp

Este punto afecta especialmente al estado de la cotización.

Actualmente el flujo manda el mensaje con `6.1 send_outbound_message`, luego inserta en `messages`, luego mezcla con el contexto. El riesgo es que después del `insert_message` se pierdan campos como:

```json
{
  "message_sent": true,
  "provider_message_id": "...",
  "provider_status": "sent"
}
```

## Problema

Si se pierde `message_sent`, el nodo `update_quote_status` puede marcar la cotización como `failed` aunque el mensaje sí se haya enviado.

## Solución recomendada

Agregar un nodo después de `6.1 send_outbound_message`:

```text
normalize_outbound_result
```

## Código sugerido

```js
const result = $json;

return [{
  ...result,
  message_sent:
    result.message_sent === true ||
    result.success === true ||
    result.status === "sent",
  provider_message_id:
    result.provider_message_id ||
    result.message_id ||
    result.provider_response?.messages?.[0]?.id ||
    null,
  provider_status:
    result.provider_status ||
    result.status ||
    null
}];
```

## Estructura recomendada

```text
build_outbound_message_payload
→ 6.1 send_outbound_message
→ normalize_outbound_result
→ insert_message
→ merge con contexto original
```

---

## E. Revisar `update_lead_state`

Actualmente existe un nodo `build_update_lead_state_query`, pero el nodo Postgres `update_lead_state` todavía contiene un SQL largo directamente.

## Problema

Eso puede hacer que el query dinámico construido en Code no se use realmente o que haya conflicto entre ambos enfoques.

Además, ya hubo errores como:

```text
Cannot access "prototype" due to security concerns
```

## Recomendación

Usar solo el query dinámico construido en Code.

## Estructura recomendada

```text
build_state_payload
→ build_update_lead_state_query
→ update_lead_state
```

El nodo Postgres `update_lead_state` debería ejecutar:

```js
{{$json.update_lead_state_query}}
```

Y no mantener el SQL gigante escrito manualmente.

---

# 3. Ramas de acción que faltan para un producto comercial

Para que el sistema sea realmente comercial y no solo un bot de cotización y agenda, conviene agregar estas acciones:

| Acción nueva | Para qué sirve |
|---|---|
| `cancel_booking` | Cancelar una reserva existente | - (COMPLETADO) 29-04-2026 
| `reschedule_booking` | Reprogramar una cita | - (COMPLETADO) 29-04-2026 
| `collect_address` | Pedir dirección exacta antes de confirmar |
| `confirm_address` | Validar dirección, comuna y recargo |
| `send_service_menu` | Mostrar servicios disponibles |
| `recommend_service` | Recomendar Nivel 1, 2 o 3 según necesidad |
| `send_pre_service_instructions` | Enviar preparación previa al servicio |
| `send_payment_link` | Enviar link de pago o abono si se implementa |
| `mark_lost` | Marcar lead perdido |
| `do_not_contact` | No volver a contactar al lead |
| `request_review` | Pedir reseña después del servicio |
| `request_referral` | Pedir referido |
| `reactivate_lead` | Reactivar clientes antiguos |
| `notify_on_the_way` | Mensaje tipo “voy en camino” |

---

# 4. Ramas recomendadas para Ahumada Detailing

## 4.1 `cancel_booking`

### Objetivo

Permitir que el cliente cancele una reserva activa.

### Flujo ideal

```text
cancel_booking
→ check_active_appointment
→ cancel_calendar_event
→ update appointment status = cancelled
→ cancel pending appointment followups
→ send cancellation confirmation
→ update lead_state
→ audit
```

### Estado final sugerido

```json
{
  "stage": "cancelled",
  "next_goal": "reactivate_later",
  "last_bot_action": "cancel_booking"
}
```

---

## 4.2 `reschedule_booking`

### Objetivo

Permitir cambiar una reserva existente.

### Flujo ideal

```text
reschedule_booking
→ check_active_appointment
→ list_available_slots
→ user selects slot
→ check_calendar_slot
→ update_calendar_event
→ update appointment start_at/end_at
→ update appointment followups
→ send confirmation
→ update lead_state
```

### Estado final sugerido

```json
{
  "stage": "booked",
  "next_goal": "pre_service_reminder",
  "last_bot_action": "reschedule_booking"
}
```

---

## 4.3 `collect_address`

### Objetivo

Pedir dirección exacta antes de confirmar el servicio a domicilio.

### Mensaje sugerido

```text
Perfecto. Para dejar la reserva bien registrada, ¿me puedes enviar la dirección exacta donde sería el servicio?
```

### Estado final sugerido

```json
{
  "stage": "collecting_address",
  "missing_fields": ["address"],
  "next_goal": "collect_address",
  "last_bot_action": "collect_address"
}
```

---

## 4.4 `confirm_address`

### Objetivo

Validar dirección, comuna y posible recargo.

### Flujo ideal

```text
confirm_address
→ parse address
→ validate district
→ check surcharge
→ update lead/address
→ continue booking
```

---

## 4.5 `send_service_menu`

### Objetivo

Mostrar opciones de servicio cuando el cliente pregunta “qué opciones tienen”.

### Ejemplo de mensaje

```text
Tenemos 3 niveles de servicio:

1. Nivel 1 — Esencial
Lavado exterior e interior básico.

2. Nivel 2 — Profundo
Limpieza más completa para interior y exterior.

3. Nivel 3 — Premium
Servicio más detallado, ideal si quieres dejar el auto impecable.

¿Buscas algo rápido o algo más completo?
```

---

## 4.6 `recommend_service`

### Objetivo

Recomendar un servicio según la necesidad del cliente.

### Ejemplos

| Necesidad del cliente | Recomendación |
|---|---|
| “Está muy sucio” | Nivel 2 o Nivel 3 |
| “Solo mantenimiento” | Nivel 1 |
| “Quiero dejarlo impecable” | Nivel 3 |
| “Está con manchas” | Nivel 2 o derivar a evaluación |
| “Lo quiero vender” | Nivel 3 |

---

## 4.7 `send_pre_service_instructions`

### Objetivo

Enviar instrucciones antes de la visita.

### Mensaje sugerido

```text
Perfecto. Antes del servicio, idealmente deja el vehículo en un lugar con acceso a agua/luz si es posible, y retira objetos personales del interior para poder trabajar mejor.
```

---

## 4.8 `notify_on_the_way`

### Objetivo

Enviar mensaje antes de llegar.

### Mensaje sugerido

```text
Hola, voy en camino al servicio. Te aviso apenas esté llegando.
```

---

## 4.9 `request_review`

### Objetivo

Pedir reseña después del servicio.

### Mensaje sugerido

```text
Gracias por confiar en nosotros. Si te gustó el resultado, nos ayudaría mucho que nos dejaras una reseña. Eso nos ayuda a seguir creciendo.
```

---

## 4.10 `request_referral`

### Objetivo

Pedir referido después de una buena experiencia.

### Mensaje sugerido

```text
Si conoces a alguien que también quiera dejar su auto impecable, feliz nos puedes recomendar. Trabajamos a domicilio y coordinamos por WhatsApp.
```

---

# 5. Qué falta para que sea producto comercial vendible

## A. Sacar valores hardcodeados

Actualmente hay valores fijos como:

- `calendar_id`
- nombres de servicios
- textos de mensajes
- horarios
- duración del servicio
- reglas de disponibilidad
- lógica específica de Ahumada Detailing

Para venderlo como producto, eso debe estar en base de datos.

---

## B. Agregar multiempresa

Todas las tablas importantes deberían tener:

```sql
organization_id
```

Tablas que deberían incluirlo:

```text
leads
lead_state
messages
appointments
offers_or_quotes
followups
audit_logs
business_services
business_pricing_rules
business_zones
business_calendars
message_templates
```

---

## C. Crear catálogo comercial configurable

Tablas recomendadas:

```sql
CREATE TABLE business_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  service_key text NOT NULL,
  name text NOT NULL,
  description text,
  base_price int,
  duration_minutes int DEFAULT 120,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

```sql
CREATE TABLE business_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  service_key text NOT NULL,
  vehicle_type text,
  district text,
  base_price int,
  surcharge int DEFAULT 0,
  final_price int,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

```sql
CREATE TABLE business_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  district text NOT NULL,
  service_available boolean DEFAULT true,
  surcharge int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

```sql
CREATE TABLE business_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  calendar_id text NOT NULL,
  name text,
  timezone text DEFAULT 'America/Santiago',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

---

## D. Crear plantillas de mensajes

No conviene dejar todos los mensajes dentro de nodos Code.

Tabla recomendada:

```sql
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  template_key text NOT NULL,
  channel text DEFAULT 'whatsapp',
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, template_key)
);
```

Templates mínimos recomendados:

```text
ask_district
ask_vehicle_type
ask_service_interest
quote_sent
quote_failed
offer_booking
available_slots
slot_unavailable
booking_confirmed
booking_cancelled
booking_rescheduled
appointment_reminder_1d
appointment_reminder_1h
pre_service_instructions
review_request
referral_request
human_handoff
```

---

## E. Crear dashboard operativo

Para producto comercial necesitas ver:

- leads nuevos
- leads cotizados
- leads agendados
- reservas confirmadas
- reservas canceladas
- followups pendientes
- errores del bot
- conversaciones en handoff
- cotizaciones enviadas
- tasa de cierre
- tasa de respuesta
- tasa de no respuesta
- tasa de error
- servicios más cotizados

---

# 6. Orden recomendado de implementación

## Prioridad 1 — Reparar cortes del flujo actual (COMPLETADO 28-04-2026)

1. Conectar `build_slot_unavailable_result` a `IF requires_message`.
2. Hacer que `build_missing_requirements_result` envíe mensaje.
3. Corregir `send_quote` para insertar cotización solo si `pricing_found = true`.
4. Preservar `message_sent` después de WhatsApp.
5. Asegurar que `update_lead_state` use el query dinámico real.

---

## Prioridad 2 — Cerrar el flujo comercial de Ahumada Detailing

6. Agregar `cancel_booking`.
7. Agregar `reschedule_booking`.
8. Agregar `collect_address`.
9. Agregar `confirm_address`.
10. Agregar `send_pre_service_instructions`.
11. Agregar `notify_on_the_way`.
12. Agregar `request_review`.
13. Agregar `request_referral`.

---

## Prioridad 3 — Convertirlo en producto comercial

14. Agregar `organization_id`.
15. Mover servicios, precios, zonas y calendarios a DB.
16. Crear plantillas de mensajes.
17. Crear configuración por negocio.
18. Crear dashboard operativo.
19. Crear analytics comerciales.
20. Separar configuración de Ahumada Detailing del motor general.

---

# 7. Estimación de avance actual

| Nivel | Porcentaje estimado |
|---|---:|
| MVP técnico | 70% - 75% |
| Closer real para Ahumada Detailing | 60% - 65% |
| Producto comercial vendible | 40% - 50% |

---

# 8. Conclusión

El `action_executor` ya tiene una base sólida y varias ramas importantes implementadas:

- validación de acciones
- validación de requisitos
- idempotencia
- cotización
- envío de mensaje
- actualización de estado
- confirmación de reserva con Calendar
- disponibilidad de horarios
- handoff humano
- followups por cotización y reserva
- auditoría

Pero todavía faltan algunos ajustes críticos para que sea estable:

```text
send_quote
missing_requirements
slot_unavailable
message_sent preservation
update_lead_state
reschedule_booking
cancel_booking
address collection
templates
multiempresa
dashboard
```

La prioridad inmediata debería ser **cerrar los cortes del flujo actual**, no agregar más IA.

Cuando esas ramas estén bien conectadas y probadas, el sistema ya puede pasar de “bot funcional” a **AI Closer comercial operativo**.

Para venderlo como psroducto, el siguiente salto es mover toda la configuración comercial a base de datos y hacer el sistema multiempresa.
