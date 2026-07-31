# Análisis QA — AI Closer Ahumada Detailing

## Resumen general

Se analizaron las pruebas QA del bot de Ahumada Detailing enfocadas en conversación comercial, agenda, cotización, cancelación, reprogramación, preguntas frecuentes, post-servicio y handoff humano.

El resultado muestra que el sistema ya tiene una base funcional importante, especialmente en:

- Captura progresiva de datos.
- Cotización básica cuando existen servicio, comuna y vehículo.
- Oferta de horarios disponibles.
- Selección de opciones de horario.
- Captura de dirección.
- Algunos casos de objeción.
- Handoff explícito cuando el cliente pide hablar con una persona.

Sin embargo, los fallos muestran patrones repetidos. El problema principal no es solo de redacción, sino de arquitectura de decisión: el bot está priorizando demasiado la recolección de datos faltantes por sobre la intención real del cliente.

---

# Diagnóstico principal

## Problema central

El bot responde muchas veces con:

```text
Perfecto. ¿Qué servicio te interesa?
```

incluso cuando el cliente no está intentando cotizar, sino que está haciendo una pregunta directa, solicitando cancelar, reprogramar, dejar una reseña, recomendar a alguien o consultar condiciones del servicio.

Esto significa que el `rules_engine` está priorizando `ask_missing_data` antes de detectar intenciones comerciales críticas.

La lógica actual parece seguir este orden:

```text
1. ¿Faltan datos para cotizar?
2. Si faltan, pedir dato.
3. Después interpretar intención.
```

El orden correcto debería ser:

```text
1. Detectar intención crítica o directa.
2. Resolver cancelación, reprogramación, handoff, FAQ, post-servicio o agenda.
3. Solo después pedir datos faltantes para cotizar.
```

---

# 1. `ask_missing_data` domina demasiado

## Qué ocurre

El bot pide datos faltantes aunque el cliente hizo una pregunta directa.

Ejemplos de mensajes mal tratados:

- `te puedo recomendar con un amigo?`
- `quedó muy bueno el lavado, gracias`
- `lavan motos?`
- `hacen descuento?`
- `necesitan agua o electricidad?`
- `ustedes van a domicilio?`
- `se puede pagar con transferencia?`
- `cancela la hora que tenía`
- `cuánto se demoran en hacer el lavado premium?`

## Por qué es problema

El bot actúa como formulario, no como closer comercial.

Un cliente que pregunta por transferencia, duración, domicilio o descuento espera una respuesta inmediata. Si el bot responde pidiendo el servicio, se siente desconectado y poco humano.

## Corrección recomendada

En `3 rules_engine`, antes de evaluar datos faltantes, agregar una capa de prioridad de intención.

Orden recomendado:

```text
1. cancel_booking
2. reschedule_booking
3. handoff_human / reclamo
4. preguntas frecuentes directas
5. post-servicio / review / referido
6. selección de horario
7. aceptación de cotización
8. datos faltantes para cotizar
```

Ejemplo conceptual:

```js
if (isCancelIntent(message)) {
  return {
    action: 'cancel_booking',
    reason: 'user_requested_cancel'
  };
}

if (isRescheduleIntent(message)) {
  return {
    action: 'reschedule_booking',
    reason: 'user_requested_reschedule'
  };
}

if (isDirectBusinessQuestion(message)) {
  return {
    action: 'answer_question',
    reason: 'direct_business_question',
    preserve_state: true
  };
}
```

---

# 2. Auditoría incompleta o inconsistente (COMPLETADO) 04-05-2026

## Qué ocurre

Hay pasos donde el bot responde, pero el audit aparece vacío o incompleto:

```json
{
  "flow_name": null,
  "decision": null,
  "idempotency_key": null
}
```

También se detectó que muchos pasos tienen:

```text
idempotency_key = null
```

Además, algunos casos muestran texto del bot aunque `message_sent` aparece como `false`.

## Por qué es problema

Esto impide saber si el mensaje realmente fue enviado, si fue solo un output interno de n8n o si quedó guardado correctamente en la base de datos.

En producción esto puede provocar:

- Mensajes duplicados.
- Reservas duplicadas.
- Falta de trazabilidad.
- QA falsamente aprobado.
- Dificultad para depurar errores.

## Corrección recomendada

En `6 action_executor`, todo camino debe cumplir:

```text
1. Crear audit_logs.
2. Guardar mensaje outbound en messages.
3. Actualizar lead_state.
4. Generar idempotency_key.
5. Devolver resultado normalizado al QA.
```

Formato recomendado de idempotencia:

```js
const idempotencyKey = `${lead.id}__${event.message_id}__${decision.action}`;
```

El QA debe fallar si:

```text
bot = null
message_sent !== true
flow_name = null
decision = null
idempotency_key = null
no existe messages.direction = outbound
```

---

# 3. `send_quote` queda como `send_quote_in_progress` (COMPLETADO) 04-05-2026

## Qué ocurre

Después de cotizar, el estado queda muchas veces como:

```text
last_bot_action = send_quote_in_progress
```

En vez de quedar como:

```text
last_bot_action = send_quote
```

## Por qué es problema

El siguiente mensaje del cliente depende mucho de saber que ya se envió una cotización.

Por ejemplo:

```text
Bot: El valor es $40.000. ¿Te gustaría agendar?
Cliente: sí
```

Si el estado final no indica que la cotización fue enviada, el sistema puede interpretar mal el `sí`.

## Corrección recomendada

Al finalizar correctamente `send_quote`, persistir:

```json
{
  "stage": "quoted",
  "last_bot_action": "send_quote",
  "next_goal": "book_appointment",
  "missing_fields": []
}
```

Si se usa `send_quote_in_progress`, debe ser solo un estado temporal interno, no el estado final persistido.

---

# 4. Cancelación y reprogramación no tienen suficiente prioridad (COMPLETADO) 04-05-2026

## Qué ocurre

En algunos escenarios el cliente pide cancelar y el bot responde pidiendo servicio.

Ejemplo:

```text
Cliente: cancela la hora que tenía
Bot: Perfecto. ¿Qué servicio te interesa?
```

En otros escenarios el cliente quiere cancelar, pero el bot queda en `null`, sin respuesta y sin audit.

También se detecta que en reprogramación sin reserva activa el bot responde correctamente, pero el QA lo marca como fallo porque la acción esperada no coincide con el resultado final.

## Corrección recomendada

Separar `action` de `outcome`.

Ejemplo:

```js
if (intent === 'cancel_booking') {
  return {
    action: 'cancel_booking',
    outcome: activeAppointment ? 'active_appointment_found' : 'no_active_appointment'
  };
}

if (intent === 'reschedule_booking') {
  return {
    action: 'reschedule_booking',
    outcome: activeAppointment ? 'active_appointment_found' : 'no_active_appointment'
  };
}
```

Así el QA puede aceptar casos como:

```text
action = reschedule_booking
outcome = no_active_appointment
last_bot_action = reschedule_no_active_appointment
```

---

# 5. Falta un bloque sólido de FAQ comercial (COMPLETADO) 04-05-2026

## Qué ocurre

Preguntas frecuentes simples están entrando al flujo de calificación.

Ejemplos:

- Forma de pago.
- Servicio a domicilio.
- Agua o electricidad.
- Duración del servicio.
- Descuentos.
- Lavado de motos.
- Diferencia entre básico y premium.
- Qué incluye cada servicio.

## Corrección recomendada

Crear un bloque `business_faq_router` dentro de `rules_engine` o como subworkflow propio.

Ejemplo:

```js
const faqRules = [
  {
    match: ['transferencia', 'pago', 'tarjeta', 'efectivo'],
    action: 'answer_question',
    topic: 'payment_methods'
  },
  {
    match: ['domicilio', 'van', 'atienden en casa'],
    action: 'answer_question',
    topic: 'home_service'
  },
  {
    match: ['agua', 'luz', 'electricidad', 'enchufe'],
    action: 'answer_question',
    topic: 'requirements'
  },
  {
    match: ['demoran', 'duración', 'cuánto tarda'],
    action: 'answer_question',
    topic: 'service_duration'
  },
  {
    match: ['descuento', 'promoción', 'rebaja'],
    action: 'answer_question',
    topic: 'discounts'
  }
];
```

Cada respuesta debe cerrar con una pregunta útil, por ejemplo:

```text
Sí, puedes pagar por transferencia. Para darte el valor exacto, dime qué servicio te interesa y qué tipo de vehículo tienes.
```

---

# 6. Post-servicio, reseñas y referidos no están siendo detectados (COMPLETADO) 04-05-2026

## Qué ocurre

El bot falla en casos como:

```text
Cliente: quedó muy bueno el lavado, gracias
Bot: Perfecto. ¿Qué servicio te interesa?
```

Y también en:

```text
Cliente: te puedo recomendar con un amigo?
Bot: Perfecto. ¿Qué servicio te interesa?
```

## Por qué es problema

Son oportunidades comerciales directas:

- Si el cliente está feliz, corresponde pedir reseña.
- Si quiere recomendar, corresponde facilitar el referido.

## Corrección recomendada

Agregar reglas:

```js
if (isPositivePostServiceMessage(message)) {
  return {
    action: 'request_review',
    reason: 'positive_post_service_feedback'
  };
}

if (isReferralIntent(message)) {
  return {
    action: 'request_referral',
    reason: 'client_wants_to_refer'
  };
}
```

Respuesta sugerida para reseña:

```text
Qué bueno saberlo, muchas gracias. Nos ayuda mucho tu opinión. ¿Te gustaría dejarnos una reseña breve para que más personas puedan conocer el servicio?
```

Respuesta sugerida para referido:

```text
Sí, feliz. Muchas gracias por recomendarnos. Puedes compartirle nuestro WhatsApp y decirle que viene recomendado por ti para atenderlo mejor.
```

---

# 7. Selección de horario inválida tiene fallback débil (COMPLETADO) 04-05-2026

## Qué ocurre

Después de ofrecer opciones 1, 2 y 3, si el cliente responde `9`, el bot dice:

```text
Gracias por tu mensaje. ¿Me puedes dar un poco más de detalle para responderte bien?
```

## Por qué es problema

El sistema ya sabe que está en selección de horario. No necesita pedir más detalle, necesita decir que la opción no es válida.

## Corrección recomendada

En estado `booking_selection` y `next_goal = collect_selected_slot`:

```js
if (isNumber(message)) {
  if (!bookingOptions[number]) {
    return {
      action: 'offer_available_slots',
      reason: 'invalid_slot_option',
      message: 'Esa opción no está disponible. Puedes responder con 1, 2 o 3.'
    };
  }
}
```

Respuesta ideal:

```text
Esa opción no está disponible. Tengo disponibles las opciones 1, 2 y 3. ¿Cuál te acomoda?
```

---

# 8. Fecha manual: el bot pide dirección antes de confirmar disponibilidad (COMPLETADO) 04-05-2026

## Qué ocurre

Cuando el cliente dice:

```text
quiero este jueves a las 9
```

el bot pide la dirección directamente.

## Por qué es problema

Antes de pedir dirección, el sistema debería confirmar que entendió el horario y que ese horario existe o está disponible.

## Flujo correcto

```text
1. Parsear fecha manual.
2. Convertirla a slot_id.
3. Revisar disponibilidad real en Calendar/DB.
4. Si está disponible, confirmar horario.
5. Luego pedir dirección.
```

Respuesta ideal:

```text
Perfecto, este jueves a las 09:00 está disponible. Para dejarlo reservado, ¿me compartes la dirección exacta donde sería el servicio?
```

Si no está disponible:

```text
Ese horario no aparece disponible. Tengo estas opciones cercanas: 1, 2 y 3. ¿Cuál te acomoda?
```

---

# 9. Handoff pasa, pero falta cierre operacional (COMPLETADO) 04-05-2026

## Qué ocurre

Los escenarios de handoff explícito pasan, pero el audit muestra campos incompletos:

```text
assigned_to = null
assigned_team = null
handoff_case_id = null
notification_sent = null
```

Aunque el bot dice que derivará a una persona, no queda claro si efectivamente se notificó a alguien.

## Corrección recomendada

El QA de handoff debería exigir:

```json
{
  "human_handoff": true,
  "handoff_case_id": "not_null",
  "notification_sent": true
}
```

Además, después del handoff:

```text
1. Pausar automatización normal.
2. Marcar human_handoff = true.
3. Crear handoff_case.
4. Notificar a humano.
5. Guardar resumen del caso.
```

---

# 10. Inconsistencias entre `decision.state_update` y `state.current` (COMPLETADO) 06-05-2026

## Qué ocurre

En algunos pasos la decisión propone un estado, pero el estado final persistido queda distinto.

Ejemplos típicos:

```text
decision.state_update.next_goal = keep_warm
state.current.next_goal = book_appointment
```

O:

```text
decision.state_update.stage = qualified
state.current.stage = closing
```

## Por qué es problema

Esto complica el QA y el debugging, porque no queda claro cuál es la fuente de verdad.

## Corrección recomendada

Definir una sola ruta de estado final:

```text
decision.state_update
→ sanitized_state_update
→ DB lead_state
→ QA lee DB lead_state
```

El QA debe comparar contra el estado final persistido, no contra estados intermedios.

---

# 11. Algunos tests QA están demasiado rígidos por palabras clave (COMPLETADO) 06-05-2026

## Qué ocurre

Hay respuestas comercialmente aceptables que fallan solo porque no contienen ciertas palabras específicas.

Ejemplo:

```text
Cliente: lo voy a pensar
Bot: Entiendo, tómate tu tiempo...
```

La respuesta no está mal, pero el QA puede fallar porque esperaba palabras como:

```text
perfecto, cualquier cosa, horario
```

## Corrección recomendada

Cambiar validaciones por keywords a validaciones por intención y estructura.

Ejemplo:

```json
{
  "expected_action": ["answer_objection", "schedule_followup"],
  "must_not_include": ["última oportunidad", "apúrate"],
  "semantic_goal": "acepta la objeción sin presionar y deja abierta la agenda"
}
```

Criterios recomendados:

```text
1. Acción correcta.
2. Estado correcto.
3. Tono correcto.
4. No inventa datos.
5. Deja siguiente paso razonable.
6. No presiona excesivamente.
```

---

# 12. Normalización de datos con errores pequeños

## Qué ocurre

Se detectan detalles como:

- `suv` en minúscula.
- `huechuraba` en minúscula.
- `las_condes` con guion bajo.
- `Moto` detectado como tipo de vehículo cuando el cliente solo preguntó si lavan motos.
- `Furgón` detectado en una pregunta que no era confirmación de vehículo.

## Corrección recomendada

Separar:

```text
mentioned_vehicle_type
confirmed_vehicle_type
```

Si el cliente pregunta:

```text
lavan motos?
```

eso no debe guardar automáticamente:

```text
vehicle_type = Moto
```

Debe tratarse como pregunta comercial.

Crear labels comerciales:

```js
function vehicleLabel(value) {
  const map = {
    suv: 'SUV',
    sedan: 'sedán',
    hatchback: 'hatchback',
    camioneta: 'camioneta',
    furgon: 'furgón'
  };

  return map[String(value).toLowerCase()] || value;
}

function districtLabel(value) {
  const map = {
    huechuraba: 'Huechuraba',
    las_condes: 'Las Condes'
  };

  return map[String(value).toLowerCase()] || value;
}
```

---

# 13. Pricing incompleto para aliases

## Qué ocurre

Algunos casos de cotización fallan con:

```text
No pude calcular la cotización en este momento.
```

Esto puede deberse a que el pricing no reconoce correctamente aliases como:

- hatchback
- auto chico
- sedán
- básico
- esencial
- profundo

## Corrección recomendada

Crear normalización antes de cotizar:

```js
const vehicleAliases = {
  'auto chico': 'sedan',
  'hatchback': 'sedan',
  'city car': 'sedan',
  'suv': 'suv',
  'camioneta': 'camioneta',
  'furgon': 'furgon',
  'furgón': 'furgon'
};

const serviceAliases = {
  'lavado esencial': 'lavado_basico',
  'esencial': 'lavado_basico',
  'lavado básico': 'lavado_basico',
  'basico': 'lavado_basico',
  'lavado profundo': 'lavado_premium',
  'profundo': 'lavado_premium',
  'premium': 'lavado_premium',
  'lavado premium': 'lavado_premium'
};
```

Si no hay precio exacto, responder:

```text
No pude encontrar ese valor exacto en este momento. Lo reviso con una persona para confirmártelo bien.
```

Pero esto debe ser excepción, no caso común.

---

# Lista priorizada de mejoras

## Prioridad 0 — Reparar QA y trazabilidad

1. Hacer que el QA lea solo `messages.direction = outbound`.
2. Fallar si `bot = null`.
3. Fallar si `message_sent !== true`.
4. Fallar si no hay `audit.flow_name`.
5. Fallar si no hay `audit.decision` o `action`.
6. Generar `idempotency_key` en todos los pasos.
7. No permitir `passed: true` si no hubo mensaje real ni cambio de estado.
8. Corregir `send_quote` para que registre audit y mensaje outbound real.
9. Validar que cada acción ejecutada cree registros esperados en DB.
10. Distinguir output interno de n8n vs mensaje realmente enviado.

---

## Prioridad 1 — Corregir reglas de intención

1. Direct questions antes de missing fields.
2. Cancelación antes de calificación.
3. Reprogramación antes de calificación.
4. Post-servicio antes de calificación.
5. Referral/review antes de calificación.
6. Selección de horario antes de fallback.
7. Preguntas frecuentes comerciales por regla.
8. Detectar aceptación después de cotización.
9. Detectar objeciones después de precio.
10. Detectar intención de agenda aunque el cliente no diga exactamente `agendar`.

---

## Prioridad 2 — Cierre y agenda

1. `send_quote` debe terminar en `stage = quoted`.
2. Después de `sí`, `dale`, `ok`, `agendemos` o `quiero agendar`, ejecutar `offer_available_slots`.
3. Si elige opción inválida, repetir opciones disponibles.
4. Si da fecha manual, revisar disponibilidad antes de pedir dirección.
5. Si cambia dirección, actualizar y confirmar el dato, no volver a pedir dirección genérica.
6. Si no hay reserva activa para cancelar o reprogramar, responder claro y guardar `outcome`.
7. Mantener `booking_options` persistidas hasta que el cliente elija.
8. Confirmar horario antes de crear reserva.
9. Confirmar dirección antes de reserva final.
10. No crear cita si falta dirección o disponibilidad confirmada.

---

## Prioridad 3 — Pulido comercial

1. Mejorar respuestas de objeciones para cerrar suave.
2. Agregar respuesta profesional para descuentos.
3. Mejorar menú de servicios.
4. Normalizar labels de comuna, vehículo y servicio.
5. Agregar follow-up cuando el cliente dice `después te aviso`.
6. Pedir reseña cuando el cliente está feliz.
7. Pedir referido cuando el cliente quiere recomendar.
8. Evitar tecnicismos como `lavado_profundo` o `lavado_premium` con guion bajo.
9. Mantener tono profesional, cercano y claro.
10. Cerrar cada respuesta con siguiente paso útil.

---

# Cambios sugeridos por workflow

## `3 rules_engine`

Agregar prioridad de intención antes de missing fields:

```text
1. handoff_human
2. cancel_booking
3. reschedule_booking
4. confirm_booking / selected_slot
5. FAQ comercial
6. post_service / review / referral
7. aceptación de cotización
8. objeciones
9. missing_fields
```

---

## `4 context_builder`

Asegurar que incluya:

```json
{
  "last_bot_action": "send_quote",
  "next_goal": "book_appointment",
  "stage": "quoted",
  "booking_options": [],
  "has_active_appointment": false,
  "has_completed_appointment": false,
  "allowed_actions": []
}
```

También debe diferenciar:

```text
mentioned_vehicle_type
confirmed_vehicle_type
```

---

## `5 llm_decision`

Ajustar prompt/schema para que el modelo no elija `ask_missing_data` si el mensaje es una pregunta directa.

Regla sugerida:

```text
Si el usuario hace una pregunta directa sobre el negocio, responde primero la pregunta. Luego, si corresponde, pide solo un dato comercial faltante.
```

---

## `6 action_executor`

Debe garantizar:

```text
1. Validación de acción.
2. Validación de datos requeridos.
3. Idempotencia.
4. Envío real del mensaje.
5. Insert en messages outbound.
6. Update lead_state.
7. Insert audit_logs.
8. Resultado normalizado para QA.
```

---

## `6.4 list_available_slots`

Agregar manejo de opción inválida:

```text
Si el cliente responde un número fuera de rango, repetir opciones disponibles.
```

---

## `6.5 confirm_booking_executor`

No debe confirmar si falta:

```text
slot_id
booking_date
booking_time
availability_confirmed
service_address
address_confirmed
```

---

## `6.10 reschedule_booking`

Debe separar acción y resultado:

```text
action = reschedule_booking
outcome = no_active_appointment | active_appointment_found | rescheduled
```

---

## `6.11 collect_address`

Debe pedir dirección solo después de tener horario seleccionado o fecha manual validada.

---

## `6.12 confirm_address`

Debe actualizar dirección si el cliente corrige el dato.

No debe volver a preguntar genéricamente la dirección si el cliente ya entregó una nueva.

---

## `6.15 request_review`

Debe activarse con:

```text
quedó muy bueno
gracias
excelente servicio
me gustó
muy conforme
```

Especialmente si el cliente tiene una cita completada o está en estado post-servicio.

---

## `6.16 request_referral`

Debe activarse con:

```text
te puedo recomendar
lo puedo compartir con un amigo
tengo un conocido
te paso un contacto
```

---

# Reglas comerciales recomendadas

## Preguntas directas

```js
if (isDirectQuestion(message)) {
  return answerQuestionAndPreserveState();
}
```

## Cancelación

```js
if (isCancelIntent(message)) {
  return cancelBookingFlow();
}
```

## Reprogramación

```js
if (isRescheduleIntent(message)) {
  return rescheduleBookingFlow();
}
```

## Aceptación después de cotización

```js
if (lastBotAction === 'send_quote' && isPositiveAcceptance(message)) {
  return {
    action: 'offer_available_slots',
    reason: 'user_accepted_quote_after_price_message'
  };
}
```

## Objeción después de cotización

```js
if (stage === 'quoted' && isObjection(message)) {
  return {
    action: 'answer_objection',
    reason: 'objection_after_quote'
  };
}
```

## Cliente desaparece o posterga

```js
if (stage === 'quoted' && isPostponeIntent(message)) {
  return {
    action: 'schedule_followup',
    reason: 'client_postponed_after_quote'
  };
}
```

---

# Conclusión

El sistema ya tiene una estructura prometedora, pero todavía necesita ordenar mejor la prioridad de intenciones.

La mejora más importante es reordenar el `rules_engine` para que no pida datos faltantes cuando el usuario hizo una acción o pregunta clara.

La segunda mejora más importante es fortalecer la trazabilidad: todo mensaje debe tener audit, idempotency key, registro outbound y estado actualizado.

Con estas correcciones, el bot pasaría de comportarse como un formulario conversacional a comportarse como un closer comercial real.

---

# Checklist final rápido

- [ ] Priorizar cancelación antes de missing fields.
- [ ] Priorizar reprogramación antes de missing fields.
- [ ] Priorizar FAQ antes de missing fields.
- [ ] Priorizar post-servicio antes de missing fields.
- [ ] Priorizar referido/reseña antes de missing fields.
- [ ] Corregir `send_quote_in_progress` como estado final.
- [ ] Agregar `idempotency_key` obligatorio.
- [ ] QA debe leer outbound real desde DB.
- [ ] Fallar si `bot = null`.
- [ ] Fallar si `audit` está vacío.
- [ ] Fallar si `message_sent !== true`.
- [ ] Mejorar opción inválida de horario.
- [ ] Validar fecha manual antes de pedir dirección.
- [ ] Mejorar handoff con notificación real.
- [ ] Separar `action` de `outcome`.
- [ ] Normalizar labels comerciales.
- [ ] Crear `business_faq_router`.
- [ ] Mejorar reglas de review/referral.
- [ ] Agregar follow-up para `después te aviso`.
- [ ] Validar que todos los caminos creen audit_logs.
