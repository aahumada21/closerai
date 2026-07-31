# Informe de inconsistencias QA — AI Closer Ahumada Detailing

**Fecha del análisis:** 2026-05-07  
**Fuente revisada:** resultados QA del bot de WhatsApp / n8n  
**Objetivo:** detectar inconsistencias, problemas reales del bot, fallas del QA y mejoras prioritarias para estabilizar el flujo comercial.

---

## 1. Resumen ejecutivo

Se revisaron los resultados QA del bot y se detectaron problemas en cuatro niveles:

1. **Problemas críticos de trazabilidad**
   - Respuestas generadas sin `audit`.
   - Falta de `idempotency_key`.
   - Mensajes visibles para el cliente sin persistencia completa.
   - Estados que no reflejan lo que el bot realmente dijo.

2. **Problemas de estado comercial**
   - Cotizaciones enviadas visualmente, pero sin quedar como `quoted`.
   - Uso persistente de estados temporales como `send_quote_in_progress`.
   - Diferencias entre `decision.state_update`, `sanitized_update` y `state.current`.

3. **Problemas funcionales**
   - Handoff humano falla completamente en casos críticos.
   - Cancelación de reservas falla completamente.
   - Reprogramación pasa el QA, pero con bugs internos.
   - Pricing incompleto o mal manejado.

4. **Problemas de conversación y QA**
   - Algunas respuestas están bien para el cliente, pero mal clasificadas.
   - El QA usa validaciones por keywords demasiado rígidas.
   - Hay falsos positivos: escenarios pasan aunque internamente tienen señales malas.

La conclusión principal es:

```text
El bot ya conversa mejor, pero todavía no está estable para producción porque no todas las respuestas pasan por la ruta formal de decisión, ejecución, persistencia y auditoría.
```

---

# 2. Diagnóstico general

La arquitectura esperada del sistema debería ser:

```text
decision
→ action_executor
→ mensaje outbound
→ update lead_state
→ audit_logs
→ QA lee desde DB/audit
```

Pero en varios casos se observa que el bot genera una respuesta visible sin completar esa ruta.

Esto genera una diferencia peligrosa entre:

```text
Lo que el cliente ve
```

y:

```text
Lo que la base de datos cree que ocurrió
```

Esa diferencia rompe el seguimiento, la agenda, la cotización, la trazabilidad y el debugging.

---

# 3. Problema crítico: auditoría vacía

## Qué ocurre

Se detectan muchos casos con errores como:

```text
audit vacío: no hay flow_name, decision ni idempotency_key
```

Lo más grave es que en varios de esos casos **sí existe `bot_response`**.

Ejemplo conceptual:

```json
{
  "bot_response": "Estos son nuestros servicios...",
  "audit_snapshot": {
    "meta": null,
    "decision": null,
    "flow_name": null,
    "created_at": null,
    "idempotency_key": null
  }
}
```

## Por qué es grave

Esto significa que el bot respondió, pero no quedó claro:

- qué acción ejecutó;
- si el mensaje fue enviado realmente por WhatsApp;
- si se guardó en `messages`;
- si se actualizó `lead_state`;
- si hubo deduplicación;
- si puede auditarse después.

## Impacto en producción

Puede provocar:

- mensajes duplicados;
- mensajes enviados sin registro;
- reservas duplicadas;
- imposibilidad de debuggear;
- QA inconsistente;
- pérdida de control sobre el flujo comercial.

## Dónde corregir

```text
6 action_executor
analytics_audit
rutas rápidas del rules_engine
QA normalizer / get outbound attempt
```

## Regla obligatoria

Todo mensaje que llegue al cliente debe tener:

```text
flow_name
decision.action
idempotency_key
outbound_message_id
provider_message_id o provider_status
outbound_message_saved = true
state_updated claro
```

---

# 4. Problema crítico: `send_quote` está incompleto

## Qué ocurre

El bot dice una cotización, por ejemplo:

```text
Perfecto. Para tu SUV en Huechuraba, el lavado premium tiene un valor de $40.000. ¿Te gustaría agendar?
```

Pero el estado queda como:

```json
{
  "stage": "qualified",
  "next_goal": "send_quote",
  "last_bot_action": "send_quote_in_progress"
}
```

O incluso:

```json
{
  "stage": "new_lead",
  "next_goal": "collect_vehicle_type",
  "vehicle_type": null,
  "last_bot_action": "ask_missing_data"
}
```

## Por qué es problema

El cliente ya recibió una cotización, pero la DB no queda como cotizada.

Entonces cuando el cliente responde:

```text
sí
dale
agendemos
después te aviso
está caro
```

el sistema no sabe correctamente que viene después de una cotización.

## Estado esperado después de cotizar

```json
{
  "stage": "quoted",
  "intent_last": "quote_sent",
  "last_bot_action": "send_quote",
  "next_goal": "book_appointment",
  "missing_fields": [],
  "vehicle_type": "SUV",
  "district": "Huechuraba",
  "service_interest": "lavado_premium"
}
```

## Dónde corregir

```text
6 action_executor → branch send_quote
send_quote_executor
pricing lookup
update_lead_state
audit_logs insert
```

## Regla importante

`send_quote_in_progress` puede existir solo como estado temporal interno, pero no debe quedar persistido como estado final.

---

# 5. Handoff humano falla completamente

## Qué ocurre

Mensajes como:

```text
quiero hablar con una persona
tuve un problema con el servicio y quiero hablar con alguien
```

terminan con:

```json
{
  "bot_response": null,
  "audit_snapshot": {
    "meta": null,
    "decision": null,
    "flow_name": null,
    "idempotency_key": null
  },
  "state_snapshot": {
    "changed": false
  }
}
```

## Por qué es grave

Una solicitud explícita de humano o un reclamo no puede quedar sin respuesta.

Estos casos deben ser tratados como reglas duras, no como decisión libre del modelo.

## Estado esperado

```json
{
  "stage": "human_handoff",
  "human_handoff": true,
  "last_bot_action": "handoff_human",
  "next_goal": "wait_human_response"
}
```

## Respuesta esperada

```text
Entiendo. Te derivo con una persona para que pueda revisar tu caso y ayudarte mejor.
```

## Dónde corregir

```text
3 rules_engine
8 human_handoff
6 action_executor → branch handoff_human
```

## Regla recomendada

```js
if (messageIncludesHumanRequest || messageIncludesComplaint) {
  return {
    action: "handoff_human",
    stage: "human_handoff",
    human_handoff: true,
    message: "Entiendo. Te derivo con una persona para que pueda revisar tu caso y ayudarte mejor."
  };
}
```

## QA esperado

El QA de handoff debería exigir:

```json
{
  "human_handoff": true,
  "handoff_case_id": "not_null",
  "notification_sent": true
}
```

---

# 6. Cancelación de reserva falla completamente

## Qué ocurre

Mensajes como:

```text
cancela la hora que tenía
quiero cancelar mi reserva
```

terminan sin respuesta:

```text
bot_response = null
audit vacío
estado sin cambios
last_bot_action = null
```

## Por qué es grave

Cancelar reserva es una intención crítica.

Debe tener prioridad alta en `rules_engine`.

## Dónde corregir

```text
3 rules_engine
6 action_executor → cancel_booking
appointments lookup
audit_logs
```

## Flujo recomendado

```js
if (intent === "cancel_booking") {
  if (!activeAppointment) {
    return {
      action: "cancel_booking",
      outcome: "no_active_appointment",
      message: "No encontré una reserva activa asociada a este número. Si quieres, lo puedo revisar con una persona."
    };
  }

  return {
    action: "cancel_booking",
    outcome: "active_appointment_found"
  };
}
```

## Separación recomendada

El QA debe separar:

```text
action = cancel_booking
outcome = no_active_appointment | active_appointment_found
```

No todos los casos de cancelación deben terminar igual.

---

# 7. Inconsistencias entre decisión y estado final

## Qué ocurre

Hay diferencias entre:

```text
decision.state_update
```

y:

```text
state.current
```

Ejemplos:

```text
decision.next_goal = handle_objection
state.current.next_goal = book_appointment
```

```text
decision.stage = qualified
state.current.stage = closing
```

```text
decision.last_bot_action = offer_available_slots_in_progress
state.current.last_bot_action = offer_available_slots
```

## Por qué es problema

No queda claro cuál es la fuente de verdad.

Esto dificulta el debugging porque el QA puede estar comparando contra un estado intermedio o contra una decisión que luego fue sanitizada.

## Corrección recomendada

Definir una sola ruta oficial:

```text
decision.state_update
→ sanitized_state_update
→ persisted lead_state
→ audit_snapshot.meta.state.current
→ QA compara contra persisted lead_state
```

## Audit recomendado

```json
{
  "decision_state_update": {},
  "sanitized_state_update": {},
  "persisted_state": {}
}
```

El QA debe validar contra `persisted_state`, no contra la decisión cruda.

---

# 8. Respuestas correctas visualmente, pero sin persistencia

## Qué ocurre

En varios casos el bot responde bien, pero el estado queda atrasado.

Ejemplos:

- El bot cotiza, pero `vehicle_type` sigue `null`.
- El bot muestra menú, pero `last_bot_action` queda `null`.
- El bot responde algo comercialmente correcto, pero no existe audit.
- El bot ofrece agendar, pero el estado sigue esperando un dato anterior.

## Por qué es problema

El cliente avanza en la conversación, pero la DB no.

Eso rompe pasos posteriores.

Ejemplo:

```text
Cliente recibe cotización.
Cliente responde "sí".
El sistema no sabe que ese "sí" era para agendar.
```

## Dónde corregir

```text
update_lead_state
code_build_output del action_executor
QA normalizer
lead_loader
```

---

# 9. Extracción de datos incompleta

## Caso detectado

Cliente:

```text
cuánto sale lavado premium para SUV?
```

Bot:

```text
Perfecto. ¿Qué tipo de vehículo tienes?
```

## Problema

El cliente ya dijo `SUV`, pero el sistema no lo usó como vehículo confirmado.

## Corrección recomendada

Separar extracción en tres capas:

```js
service_interest = extractService(message)
mentioned_vehicle_type = extractVehicleMention(message)
confirmed_vehicle_type = confirmIfUserAnsweringVehicleQuestion(message, state.next_goal)
district = extractDistrict(message)
```

## Regla recomendada

```js
if (message includes SUV) {
  mentioned_vehicle_type = "SUV";

  if (next_goal === "collect_vehicle_type" || quote_requested) {
    confirmed_vehicle_type = "SUV";
    vehicle_type = "SUV";
  }
}
```

---

# 10. Normalización visual débil en mensajes

## Qué ocurre

Aparecen mensajes como:

```text
Para tu suv en huechuraba...
Para tu suv en las_condes...
```

## Problema

El mensaje se ve menos profesional.

## Forma correcta

```text
Para tu SUV en Huechuraba...
Para tu SUV en Las Condes...
```

## Dónde corregir

```text
message builders
serviceLabel()
vehicleLabel()
districtLabel()
```

## Funciones recomendadas

```js
function vehicleLabel(value) {
  const map = {
    suv: "SUV",
    SUV: "SUV",
    camioneta: "camioneta",
    hatchback: "hatchback",
    sedan: "sedán",
    auto: "auto"
  };

  return map[String(value || "").toLowerCase()] || value;
}

function districtLabel(value) {
  const map = {
    huechuraba: "Huechuraba",
    las_condes: "Las Condes",
    "las condes": "Las Condes"
  };

  return map[String(value || "").toLowerCase()] || value;
}
```

---

# 11. Menú de servicios con prioridad insuficiente

## Caso detectado

Cliente:

```text
qué servicios tienen disponible
```

Bot:

```text
Perfecto. ¿Qué servicio te interesa?
```

## Problema

Si el cliente pregunta por servicios, el bot debe mostrar el menú, no pedir de inmediato el servicio.

## Acción esperada

```json
{
  "action": "send_service_menu",
  "last_bot_action": "send_service_menu",
  "next_goal": "collect_service_interest"
}
```

## Dónde corregir

```text
3 rules_engine → business_faq_router / service_menu_router
6 action_executor → send_service_menu
```

## Regla recomendada

```js
if (asksForServiceMenu(message)) {
  return {
    action: "send_service_menu",
    last_bot_action: "send_service_menu",
    next_goal: "collect_service_interest"
  };
}
```

---

# 12. Objeciones y “después te aviso” mal clasificadas

## Caso detectado

Cliente:

```text
después te aviso
```

Bot:

```text
Perfecto, quedo atento. Cuando quieras retomamos y te ayudo a agendar el servicio a domicilio.
```

El mensaje es correcto, pero la acción queda como:

```text
last_bot_action = offer_booking
```

## Problema

Eso no es realmente `offer_booking`.

Debería ser una acción relacionada con postergación o seguimiento.

## Acciones más correctas

```text
schedule_followup
answer_objection
mark_postponed
```

## Estado recomendado

```json
{
  "stage": "quoted",
  "intent_last": "postpone",
  "last_bot_action": "schedule_followup",
  "next_goal": "wait_or_followup"
}
```

Además debería crearse un registro en `followups`.

---

# 13. Reprogramación pasa QA, pero tiene bugs internos

## Qué ocurre

Los escenarios de reprogramación pasan, pero internamente muestran problemas.

Ejemplo:

```json
"decision": "{"action":"reschedule_booking"...}"
```

Eso significa que `decision` está guardado como string, no como objeto JSON.

También aparece:

```json
"proposed_update": {
  "0": "{",
  "1": "}",
  "next_goal": "book_appointment"
}
```

## Diagnóstico

Parece un bug de serialización o de merge/spread de un string en vez de un objeto.

## Problema adicional

Cuando no hay reserva activa, el bot responde:

```text
No encontré una reserva activa para reprogramar. Si quieres, puedo ayudarte a agendar una nueva.
```

Pero el estado queda como:

```json
{
  "stage": "reschedule",
  "next_goal": "collect_new_slot"
}
```

## Estado recomendado si no hay reserva activa

```json
{
  "stage": "new_lead",
  "intent_last": "no_active_appointment",
  "last_bot_action": "reschedule_booking",
  "next_goal": "book_appointment"
}
```

O alternativamente:

```json
{
  "stage": "booking_selection",
  "next_goal": "offer_new_booking"
}
```

solo si el usuario confirma que quiere agendar una nueva.

---

# 14. Pricing incompleto o mal manejado

## Caso detectado

Cliente:

```text
hatchback
```

Bot:

```text
No pude calcular la cotización en este momento. Lo revisaré y te ayudo enseguida.
```

Pero el estado queda como si hubiera cotizado:

```json
{
  "stage": "quoted",
  "next_goal": "book_appointment",
  "last_bot_action": "send_quote"
}
```

## Problema

Si no se encontró precio, no debe quedar como `quoted`.

## Estado correcto si no hay precio

```json
{
  "stage": "qualified",
  "intent_last": "pricing_not_found",
  "last_bot_action": "pricing_error",
  "next_goal": "handoff_or_manual_quote"
}
```

## Dónde corregir

```text
send_quote_executor
pricing lookup
pricing_rule_not_found handler
update_lead_state
```

---

# 15. Problemas del QA: falsos negativos

## Qué ocurre

Algunos escenarios fallan aunque la respuesta del bot no sea mala.

Ejemplo:

```text
Bot: Claro, tómate tu tiempo. Si quieres, te puedo dejar la cotización lista para que la revises con calma.
```

Pero el QA falla porque esperaba keywords como:

```text
perfecto
cualquier cosa
te puedo ayudar
horario
```

## Problema

El QA está validando demasiado por palabras exactas.

## Corrección recomendada

Validar por intención semántica o flags:

```json
{
  "acknowledges_delay": true,
  "does_not_pressure": true,
  "keeps_option_open": true,
  "does_not_reset_flow": true
}
```

---

# 16. Problemas del QA: falsos positivos

## Qué ocurre

Algunos escenarios pasan aunque internamente tengan señales malas:

- `validation = null`;
- `decision` guardado como string;
- estado final distinto de la decisión;
- `db_records_created` incompleto;
- audit parcial;
- `execution_meta` como string;
- `last_bot_action` temporal persistido.

## Corrección recomendada

El QA no debe validar solo que exista una respuesta bonita.

Debe validar:

```text
respuesta visible
acción correcta
estado final correcto
audit correcto
mensaje guardado
idempotencia
provider_status
DB records esperados
```

---

# 17. Checklist de corrección por prioridad

## Prioridad 1 — Bloqueante para producción

- [ ] Toda respuesta debe pasar por `action_executor`.
- [ ] Toda respuesta debe tener `audit_logs`.
- [ ] Toda respuesta debe tener `idempotency_key`.
- [ ] Todo mensaje outbound debe guardarse en `messages`.
- [ ] `send_quote` debe persistir `stage = quoted`.
- [ ] El estado final no debe quedar como `send_quote_in_progress`.
- [ ] Handoff humano debe responder siempre.
- [ ] Cancelación debe responder siempre.
- [ ] El QA debe detectar respuestas sin audit como fallo crítico.

---

## Prioridad 2 — Estado y consistencia

- [ ] Unificar `decision.state_update`, `sanitized_update` y estado persistido.
- [ ] Guardar `decision` como JSON, no como string.
- [ ] Guardar `execution_meta` como JSON, no como string.
- [ ] Corregir bug de `proposed_update` con claves `"0": "{"`.
- [ ] Separar `action` de `outcome`.
- [ ] QA debe comparar contra estado final persistido.
- [ ] No persistir estados temporales como estado final.

---

## Prioridad 3 — Conversación comercial

- [ ] Mejorar detección de `SUV`, `auto`, `camioneta`, `hatchback`.
- [ ] Mejorar detección de comuna.
- [ ] Normalizar labels visibles.
- [ ] Mostrar menú cuando el cliente pregunta por servicios.
- [ ] Crear followups cuando el cliente dice “después te aviso”.
- [ ] Manejar objeciones sin forzar agendamiento.
- [ ] Agregar pricing faltante o derivar correctamente.

---

# 18. Ruta recomendada de corrección

## Paso 1 — Blindar `action_executor`

Antes de mejorar más conversación, asegurar que toda respuesta tenga:

```json
{
  "flow_name": "action_executor",
  "decision": {},
  "idempotency_key": "...",
  "message_sent": true,
  "outbound_message_saved": true,
  "state_updated": true
}
```

---

## Paso 2 — Arreglar `send_quote`

Al finalizar correctamente:

```json
{
  "stage": "quoted",
  "last_bot_action": "send_quote",
  "next_goal": "book_appointment",
  "intent_last": "quote_sent",
  "missing_fields": []
}
```

Si falla pricing:

```json
{
  "stage": "qualified",
  "last_bot_action": "pricing_error",
  "intent_last": "pricing_not_found",
  "next_goal": "manual_quote_or_handoff"
}
```

---

## Paso 3 — Reglas duras antes del LLM

Agregar prioridad alta para:

```text
handoff_human
cancel_booking
reschedule_booking
send_service_menu
business_faq
invalid_slot_selection
```

---

## Paso 4 — Reforzar QA

Cada paso QA debería validar:

```json
{
  "has_bot_response": true,
  "has_audit": true,
  "has_idempotency_key": true,
  "message_saved": true,
  "state_updated_expected": true,
  "action_expected": true,
  "provider_status_ok": true
}
```

---

# 19. Conclusión

El sistema ya tiene avances importantes en conversación: responde FAQ, objeciones, reseñas, referidos, horarios y datos de reserva mejor que antes.

Pero todavía no está listo para producción porque el problema principal no es solo de copy o mensajes. El problema real es de arquitectura operacional:

```text
Hay respuestas que existen para el cliente, pero no existen correctamente para la base de datos ni para el audit.
```

La regla central para estabilizar el sistema debe ser:

```text
Ninguna respuesta al cliente puede existir sin audit, idempotency_key, mensaje outbound guardado y estado final persistido.
```

Una vez corregido eso, los siguientes problemas —cotización, handoff, cancelación, reprogramación, normalización y followups— serán mucho más fáciles de depurar y cerrar.
