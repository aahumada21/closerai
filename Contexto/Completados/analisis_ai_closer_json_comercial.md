# Análisis comercial y técnico del AI Closer en n8n

## Proyecto
**AI Closer para Ahumada Detailing / Grupo AAhumada**

## Objetivo del análisis
Revisar los workflows JSON actuales del sistema:

1. `3 rules_engine` (COMPLETADO) 29-04-2026
2. `4 context_builder`(COMPLETADO) 01-05-2026
3. `5 llm_decision` (COMPLETADO) 01-05-2026
4. `6 action_executor`(COMPLETADO) 01-05-2026

Y compararlos con el documento guía `action_executor_faltantes_producto_comercial.md`, identificando:

- Qué está bien implementado.
- Qué falta.
- Qué está incompleto o puede romper producción.
- Qué mejoras son necesarias para dejarlo comercial.
- Qué faltaría para venderlo como producto multiempresa.

---

# 1. Veredicto general

El sistema ya está bastante avanzado y se acerca a un **MVP comercial operativo** para Ahumada Detailing.

Sin embargo, todavía no debe considerarse un producto comercial completo ni vendible a múltiples negocios, porque aún existen dependencias hardcodeadas, estados incompletos, reglas comerciales faltantes y algunos cortes de persistencia.

## Estado estimado actual

| Nivel | Avance estimado |
|---|---:|
| MVP técnico | 80% |
| Closer real para Ahumada Detailing | 68% - 72% |
| Producto comercial vendible | 45% - 50% |

## Diagnóstico resumido

| Área | Estado actual | Diagnóstico |
|---|---:|---|
| `rules_engine` | Bien, pero incompleto | Detecta disponibilidad, datos faltantes y selección de horario, pero le faltan reglas comerciales nuevas |
| `context_builder` | Funcional, pero limitado | Construye buen contexto, pero sus `allowed_actions` no representan todavía toda la máquina comercial |
| `llm_decision` | Bastante sólido | Tiene schema estricto y validaciones, pero todavía está pensado para las acciones antiguas |
| `action_executor` | Avanzado | Ya tiene muchas ramas nuevas conectadas, pero aún hay cortes de persistencia, estado y configuración |
| Producto comercial vendible | No todavía | Falta multiempresa, templates, dashboard, configuración por negocio y reglas desde DB |

---

# 2. Diagnóstico del `rules_engine`

## 2.1 Lo que está bien

El `rules_engine` ya cumple varias funciones importantes:

- Normaliza el contexto de entrada.
- Detecta datos desde el texto del usuario:
  - comuna
  - tipo de vehículo
  - servicio solicitado
- Detecta intención de disponibilidad:
  - horarios
  - fechas disponibles
  - próxima semana
  - más horarios
  - este mes
- Evita errores comunes de interpretación.
- Detecta selección de opciones como `1`, `2`, `3`.
- Evita interpretar `1` como hora `01:00` cuando el usuario está eligiendo un slot.
- Puede responder preguntas directas sobre el servicio premium.
- Puede enviar a `offer_available_slots` cuando el usuario pide disponibilidad.

Esto es positivo porque resuelve problemas anteriores donde el bot respondía texto genérico en vez de consultar disponibilidad real.

---

## 2.2 Lo que falta

El `rules_engine` todavía está demasiado enfocado en:

- pedir datos faltantes
- responder preguntas simples
- ofrecer horarios
- confirmar selección de horario

Pero no gobierna completamente las nuevas acciones comerciales.

## Acciones nuevas que deben tener reglas duras

Actualmente estas acciones existen o están consideradas en el `action_executor`, pero no están suficientemente gobernadas desde reglas:

| Acción | Estado recomendado |
|---|---|
| `cancel_booking` | Debe ser regla dura |
| `reschedule_booking` | Debe ser regla dura |
| `collect_address` | Debe activarse antes de confirmar reserva |
| `confirm_address` | Debe activarse cuando el usuario entrega dirección |
| `send_service_menu` | Falta como acción comercial |
| `recommend_service` | Falta como acción comercial |
| `request_review` | Debe activarse post servicio |
| `request_referral` | Debe activarse post servicio o cliente satisfecho |
| `notify_on_the_way` | Debe activarse desde evento operativo o estado booked |
| `send_pre_service_instructions` | Debe activarse antes del servicio confirmado |

---

## 2.3 Mejora recomendada

Agregar reglas antes de `ruleMissingRequiredFields`.

Orden recomendado:

```text
ruleHumanHandoffLocked
ruleExplicitHumanRequest
ruleEmptyMessage
ruleCancelBooking
ruleRescheduleBooking
ruleConfirmAddressIfWaitingAddress
ruleSelectOfferedSlot
ruleConfirmBookingFromUserConfirmation
ruleAvailabilityRequest
ruleServiceMenuRequest
ruleRecommendService
ruleServiceDetailsPremium
ruleMissingRequiredFields
ruleDefaultSendToLLM
```

---

## 2.4 Reglas nuevas recomendadas

### `ruleCancelBooking`

Debe detectar mensajes como:

```text
quiero cancelar
cancela la reserva
no podré asistir
anula la hora
cancela mi lavado
```

Resultado esperado:

```json
{
  "resolution_type": "rule_based",
  "action": "cancel_booking",
  "reason": "user_requested_cancellation",
  "message": "",
  "state_update": {
    "stage": "cancelling",
    "next_goal": "cancel_active_booking",
    "last_bot_action": "cancel_booking_in_progress"
  }
}
```

---

### `ruleRescheduleBooking`

Debe detectar mensajes como:

```text
quiero reagendar
quiero reprogramar
cambiar la hora
cambiar el horario
otro día
otra hora
no puedo ese día
```

Resultado esperado:

```json
{
  "resolution_type": "rule_based",
  "action": "reschedule_booking",
  "reason": "user_requested_reschedule",
  "message": "",
  "state_update": {
    "stage": "reschedule",
    "next_goal": "collect_new_slot",
    "last_bot_action": "reschedule_booking_in_progress"
  }
}
```

---

### `ruleConfirmAddressIfWaitingAddress`

Debe detectar cuando el bot está esperando dirección y el usuario entrega una dirección.

Condición sugerida:

```js
const waitingAddress =
  leadState.stage === "collecting_address" ||
  leadState.next_goal === "collect_address" ||
  leadState.last_bot_action === "collect_address";
```

Resultado esperado:

```json
{
  "resolution_type": "rule_based",
  "action": "confirm_address",
  "reason": "user_provided_service_address",
  "message": "",
  "state_update": {
    "stage": "address_confirmation",
    "next_goal": "validate_address",
    "last_bot_action": "confirm_address_in_progress"
  }
}
```

---

# 3. Diagnóstico del `context_builder`

## 3.1 Lo que está bien

El `context_builder` está bien construido en concepto.

Hace correctamente:

- Construye `context_packet`.
- Valida `lead.id`.
- Valida `phone`.
- Valida `channel`.
- Limpia `missing_fields`.
- Separa:
  - lead
  - state
  - conversation
  - business
  - rule_context
  - context_hints
  - allowed_actions
- Evita mandar historial completo.
- Devuelve un paquete limpio al flujo padre.

Esto está alineado con una arquitectura profesional: el LLM no recibe todo el historial, sino contexto estructurado y acciones permitidas.

---

## 3.2 Problema principal

El problema fuerte es que `allowed_actions` todavía es demasiado simple.

Actualmente se basa principalmente en:

- si existe `ruleResult.action`
- si faltan campos
- si existen servicio, comuna y vehículo
- si está en handoff

Eso sirve para el MVP, pero no representa una máquina comercial real.

---

## 3.3 Qué falta

Falta una lógica centralizada por estado comercial.

Ejemplo recomendado:

```js
const ALLOWED_ACTIONS_BY_STAGE = {
  new_lead: [
    "ask_missing_data",
    "send_service_menu",
    "recommend_service",
    "answer_question",
    "handoff_human"
  ],

  qualified: [
    "send_quote",
    "offer_available_slots",
    "answer_question",
    "answer_objection",
    "handoff_human"
  ],

  quoted: [
    "answer_objection",
    "offer_available_slots",
    "collect_address",
    "handoff_human"
  ],

  booking_selection: [
    "confirm_booking",
    "offer_available_slots",
    "reschedule_booking",
    "handoff_human"
  ],

  collecting_address: [
    "confirm_address",
    "collect_address",
    "handoff_human"
  ],

  booked: [
    "cancel_booking",
    "reschedule_booking",
    "send_pre_service_instructions",
    "notify_on_the_way",
    "answer_question",
    "handoff_human"
  ],

  post_service: [
    "request_review",
    "request_referral",
    "answer_question",
    "handoff_human"
  ],

  human_handoff: []
};
```

---

## 3.4 Mejora recomendada

El `context_builder` debería construir `allowed_actions` así:

1. Si `human_handoff = true`, no permitir acciones automáticas.
2. Si `rule_result.action` existe, permitir esa acción.
3. Si no hay regla directa, mirar `stage`.
4. Usar `ALLOWED_ACTIONS_BY_STAGE[stage]`.
5. Filtrar acciones según datos disponibles.
6. Incluir `handoff_human` como escape seguro cuando corresponda.

---

# 4. Diagnóstico del `llm_decision`

## 4.1 Lo que está bien

El `llm_decision` está bastante sólido.

Actualmente tiene:

- prompt de sistema/developer con reglas claras
- salida JSON estricta
- `allowed_actions` como enum dinámico
- parseo de respuesta
- validación posterior
- fallback seguro
- prohibición de inventar precios
- prohibición de inventar horarios
- prohibición de inventar reservas
- instrucción de elegir una sola acción

Esto es correcto porque el LLM debe ser una capa de decisión, no un ejecutor libre.

---

## 4.2 Problema principal

El `llm_decision` todavía está escrito principalmente para las acciones antiguas.

Acciones bien explicadas actualmente:

```text
ask_missing_data
send_quote
answer_question
answer_objection
offer_booking
offer_available_slots
confirm_booking
schedule_followup
handoff_human
```

Acciones nuevas que faltan en el prompt:

```text
cancel_booking
reschedule_booking
collect_address
confirm_address
send_pre_service_instructions
notify_on_the_way
request_review
request_referral
```

---

## 4.3 Mejora recomendada del prompt

Agregar esta sección al developer prompt:

```text
Acciones comerciales adicionales:

- cancel_booking: úsala cuando el cliente quiere cancelar una reserva existente.
- reschedule_booking: úsala cuando el cliente quiere cambiar día u hora de una reserva.
- collect_address: úsala cuando falta dirección exacta antes de confirmar servicio a domicilio.
- confirm_address: úsala cuando el cliente entrega una dirección y estamos esperando validarla.
- send_pre_service_instructions: úsala antes del servicio confirmado para preparar al cliente.
- notify_on_the_way: úsala cuando corresponde avisar que el equipo va en camino.
- request_review: úsala después de un servicio completado para pedir reseña.
- request_referral: úsala después de una experiencia positiva para pedir referido.
```

---

## 4.4 Problema con `confirm_booking`

El validador de `confirm_booking` todavía está pensado para una estructura antigua.

Actualmente revisa cosas como:

```js
state.pending_booking_slot
state.booking_slot
ruleContext.booking_candidate
ruleContext.calendar_hold
```

Pero el sistema actual trabaja con:

```text
booking_date
booking_time
slot_id
selected_slot
slot_start_at
slot_end_at
```

Eso puede provocar que una confirmación válida sea rechazada.

---

## 4.5 Corrección recomendada

Modificar la validación de `confirm_booking`:

```js
const hasBookingContext =
  !!state.pending_booking_slot ||
  !!state.booking_slot ||
  !!ruleContext.booking_candidate ||
  !!ruleContext.calendar_hold ||
  (!!state.booking_date && !!state.booking_time) ||
  (!!parsed.state_update?.booking_date && !!parsed.state_update?.booking_time) ||
  !!parsed.state_update?.slot_id;
```

---

# 5. Diagnóstico del `action_executor`

## 5.1 Lo que está bien

El `action_executor` es el workflow más avanzado.

Actualmente tiene:

- validación global de acciones
- validación contra `context_packet.allowed_actions`
- router con 17 salidas
- ramas nuevas para:
  - `cancel_booking`
  - `reschedule_booking`
  - `collect_address`
  - `confirm_address`
  - `send_pre_service_instructions`
  - `notify_on_the_way`
  - `request_review`
  - `request_referral`
- subworkflows conectados
- rama de cotización con `IF pricing_found`
- disponibilidad real con subworkflow de slots
- confirmación con subworkflow de booking
- handoff con subworkflow humano
- normalización del resultado de WhatsApp
- persistencia de mensajes
- auditoría
- idempotencia

Esto ya no es un chatbot básico. Es un motor de acciones comerciales avanzado.

---

## 5.2 Corte crítico 1: `update_lead_state`

Este es el punto más importante.

Aunque existe un nodo `build_update_lead_state_query`, el nodo Postgres `update_lead_state` todavía mantiene un SQL largo escrito directamente.

Eso puede provocar:

- conflicto entre query dinámico y query manual
- errores de seguridad como `Cannot access "prototype" due to security concerns`
- estados actualizados de forma incompleta
- dificultad para mantener el flujo

---

## 5.3 Corrección recomendada

El nodo Postgres `update_lead_state` debería ejecutar solo:

```js
{{$json.update_lead_state_query}}
```

Y eliminar el SQL largo manual.

Estructura correcta:

```text
build_state_payload
→ build_update_lead_state_query
→ update_lead_state
```

---

## 5.4 Corte crítico 2: confirmar reserva sin dirección

Para Ahumada Detailing, el servicio es a domicilio. Por lo tanto, no conviene confirmar una reserva sin dirección exacta.

Actualmente `confirm_booking` exige:

```text
lead_id
channel
service_interest
vehicle_type
district
booking_date
booking_time
```

Pero no exige:

```text
service_address
address_confirmed
address_reference
```

Esto permite crear reservas sin dirección exacta.

---

## 5.5 Flujo comercial recomendado

El flujo correcto debería ser:

```text
offer_available_slots
→ user selects option
→ collect_address
→ confirm_address
→ confirm_booking
→ create calendar booking
→ update appointment
→ send confirmation
```

No debería ser:

```text
offer_available_slots
→ user selects option
→ confirm_booking directo
```

---

## 5.6 Regla recomendada antes de `confirm_booking`

```js
if (
  action === "confirm_booking" &&
  !execution_context.service_address &&
  !context_packet.state?.service_address
) {
  return collect_address;
}
```

O mejor todavía: resolverlo desde `rules_engine` y `context_builder`.

---

## 5.7 Corte crítico 3: `schedule_followup` puede perder contexto

El nodo `insert_followup` puede devolver solo la fila insertada, perdiendo:

```text
execution_context
context_packet
decision
state_update
```

Por eso no conviene conectarlo directo a `IF requires_message`.

---

## 5.8 Corrección recomendada

Usar un merge después de insertar followup:

```text
schedule_followup
→ insert_followup
→ merge_followup_with_context
→ persist_results
```

Normalmente `schedule_followup` no necesita enviar mensaje inmediato.

---

## 5.9 Corte crítico 4: acciones nuevas existen, pero no están gobernadas por estado

El `action_executor` ya tiene acciones nuevas, pero esas acciones deben ser elegibles solo en los estados correctos.

Ejemplo recomendado:

```text
booked → cancel_booking / reschedule_booking / send_pre_service_instructions / notify_on_the_way
post_service → request_review / request_referral
collecting_address → confirm_address
quoted → offer_available_slots / collect_address / answer_objection
```

---

# 6. Qué falta para dejarlo comercial para Ahumada Detailing

## 6.1 Faltantes principales

Para que quede comercial en Ahumada Detailing, falta:

1. Forzar dirección antes de confirmar reserva.
2. Corregir `update_lead_state` para usar query dinámico real.
3. Agregar reglas duras de cancelación.
4. Agregar reglas duras de reprogramación.
5. Agregar reglas duras de dirección.
6. Ajustar `context_builder` por estado.
7. Ajustar `llm_decision` para acciones nuevas.
8. Estandarizar salida de subworkflows.
9. Probar conversaciones completas de punta a punta.
10. Auditar que cada acción actualice correctamente `lead_state`.

---

## 6.2 Flujo ideal comercial de reserva

```text
Usuario pide horarios
→ rules_engine detecta disponibilidad
→ action_executor consulta slots reales
→ bot muestra opciones
→ usuario elige 1, 2 o 3
→ rules_engine detecta selección
→ si no hay dirección: collect_address
→ usuario entrega dirección
→ confirm_address valida comuna/recargo
→ confirm_booking verifica disponibilidad final
→ create_calendar_booking crea evento
→ appointments guarda reserva
→ messages guarda confirmación
→ lead_state queda booked
→ followups crea recordatorios
```

---

# 7. Qué falta para venderlo como producto multiempresa

Para venderlo como producto, no basta con que funcione para Ahumada Detailing.

Hay que convertirlo en un motor configurable.

---

## 7.1 Sacar valores hardcodeados

Actualmente hay valores o lógica específica que deberían salir de los nodos:

```text
calendar_id
nombres de servicios
textos de mensajes
horarios
duración del servicio
reglas de disponibilidad
comunas
lógica específica de Ahumada Detailing
```

Todo eso debería ir a base de datos.

---

## 7.2 Agregar `organization_id`

Tablas que deberían tener `organization_id`:

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

Esto permite que el mismo motor funcione para varios negocios.

---

## 7.3 Crear catálogo comercial configurable

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

## 7.4 Crear plantillas de mensajes

No conviene dejar mensajes dentro de nodos Code.

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

## 7.5 Crear dashboard operativo

Para venderlo comercialmente, necesitas ver:

```text
leads nuevos
leads cotizados
leads agendados
reservas confirmadas
reservas canceladas
followups pendientes
errores del bot
conversaciones en handoff
cotizaciones enviadas
tasa de cierre
tasa de respuesta
tasa de no respuesta
tasa de error
servicios más cotizados
```

---

# 8. Prioridades de implementación

## Prioridad 1 — Corregir cortes que pueden romper producción

1. Cambiar `update_lead_state` para que use solo:

```js
{{$json.update_lead_state_query}}
```

2. Agregar `merge_followup_with_context` después de `insert_followup`.

3. Enforzar dirección antes de `confirm_booking`.

4. Corregir validación de `confirm_booking` en `llm_decision`.

5. Revisar que todos los subworkflows devuelvan `execution_result`.

---

## Prioridad 2 — Hacer que las acciones nuevas sean realmente elegibles

6. Actualizar `context_builder` con `ALLOWED_ACTIONS_BY_STAGE`.

7. Actualizar prompt de `llm_decision` para acciones nuevas.

8. Agregar reglas duras en `rules_engine` para:

```text
cancel_booking
reschedule_booking
collect_address
confirm_address
request_review
request_referral
```

9. Agregar estado `collecting_address`.

10. Agregar estado `post_service`.

---

## Prioridad 3 — Convertirlo en producto

11. Crear tabla `message_templates`.

12. Crear tablas:

```text
business_services
business_pricing_rules
business_zones
business_calendars
```

13. Agregar `organization_id`.

14. Crear dashboard operativo.

15. Separar configuración de Ahumada Detailing del motor general.

---

# 9. Pruebas comerciales recomendadas

No basta con probar nodos aislados.

Se deben probar conversaciones completas.

## Test 1 — Cotización completa

```text
Usuario: Hola, cuánto sale un lavado premium
Bot: pregunta vehículo o comuna si falta
Usuario: SUV en Huechuraba
Bot: envía cotización
Bot: ofrece agendar
```

Validar:

```text
lead_state.stage = quoted
quote insertada
message_sent = true
followups creados
```

---

## Test 2 — Agendamiento completo con dirección

```text
Usuario: qué horarios tienen
Bot: ofrece opciones reales
Usuario: 1
Bot: pide dirección
Usuario: Av. Pedro Fontova 7450, Huechuraba
Bot: confirma dirección
Bot: crea reserva
```

Validar:

```text
appointment creada
calendar event creado
lead_state.stage = booked
booking_date guardado
booking_time guardado
service_address guardado
```

---

## Test 3 — Cancelación

```text
Usuario: quiero cancelar mi reserva
Bot: confirma cancelación
```

Validar:

```text
appointment.status = cancelled
calendar event cancelado
followups pendientes cancelados
lead_state.stage = cancelled
```

---

## Test 4 — Reprogramación

```text
Usuario: quiero cambiar la hora
Bot: ofrece nuevos horarios
Usuario: 2
Bot: actualiza reserva
```

Validar:

```text
appointment actualizada
calendar event actualizado
followups reprogramados
lead_state.stage = booked
```

---

## Test 5 — Precio no encontrado

```text
Usuario: quiero cotizar servicio no configurado
Bot: no puede cotizar y deriva/revisa manualmente
```

Validar:

```text
no se inserta quote inválida
no se crean followups de quote inválida
se guarda mensaje de error controlado
```

---

## Test 6 — Handoff humano

```text
Usuario: quiero hablar con una persona
Bot: deriva a humano
```

Validar:

```text
human_handoff = true
handoff_case creado
humano notificado
bot no sigue respondiendo automáticamente
```

---

## Test 7 — Post servicio

```text
Servicio marcado como completado
Bot: pide reseña
Luego: pide referido
```

Validar:

```text
request_review enviado
request_referral enviado
followups post servicio registrados
```

---

# 10. Conclusión final

El sistema ya tiene una base sólida y está bastante avanzado para Ahumada Detailing.

Sin embargo, todavía no está al 100%.

## Para Ahumada Detailing

Falta principalmente:

```text
dirección antes de reserva
state machine comercial más clara
reglas duras para cancelar/reagendar/dirección
corrección definitiva de update_lead_state
pruebas completas de punta a punta
```

## Para producto comercial vendible

Falta principalmente:

```text
multiempresa
organization_id
templates configurables
servicios/precios/zonas desde DB
dashboard operativo
configuración por negocio
salidas estándar de subworkflows
```

## Cadena ideal final

```text
rules_engine decide bien
→ context_builder permite la acción correcta
→ llm_decision valida sin bloquear casos válidos
→ action_executor ejecuta y persiste sin perder contexto
→ DB queda como fuente de verdad
→ dashboard permite medir rendimiento
```

Cuando esa cadena esté cerrada, el sistema dejará de ser solo un flujo avanzado de n8n y pasará a ser un AI Closer comercial realmente vendible.
