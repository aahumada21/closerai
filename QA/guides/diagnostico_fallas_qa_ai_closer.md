# Diagnóstico de fallas QA — AI Closer Ahumada Detailing

**Fecha:** 03 de mayo de 2026  
**Contexto:** análisis de pruebas QA del bot comercial de WhatsApp para Ahumada Detailing.  
**Objetivo del documento:** dejar una lista clara de fallas, inconsistencias y mejoras necesarias detectadas en las pruebas.

---

# 1. Resumen ejecutivo

El resultado de las pruebas QA muestra una falla transversal antes de evaluar la calidad comercial del bot.

El problema principal no es solamente que falten respuestas para servicios, horarios, objeciones o agenda. El problema base es que el sistema de QA está registrando:

```json
"bot": null
```

y además:

```json
"audit": {
  "decision": null,
  "flow_name": null,
  "idempotency_key": null
}
```

También se observa que el estado del lead queda pegado en:

```json
"stage": "new_lead",
"next_goal": "qualify_lead",
"last_bot_action": null,
"service_interest": null,
"district": null,
"vehicle_type": null
```

Esto significa que el QA no está capturando la respuesta real del bot, o que el flujo no está llegando correctamente a la ejecución, persistencia, auditoría y lectura del mensaje saliente.

Antes de corregir reglas comerciales específicas, se debe reparar la ejecución y captura del QA.

---

# 2. Prioridad 0 — Fallas críticas del QA / ejecución

Estas son las fallas que deben repararse primero. Sin esto, los demás resultados del QA pueden ser engañosos.

## 2.1 El QA no espera la respuesta real del bot

### Qué ocurre

El QA envía el mensaje del cliente y evalúa el resultado sin esperar correctamente a que n8n termine de ejecutar el flujo y registre la respuesta saliente.

### Evidencia

En los escenarios aparece:

```json
"bot": null
```

### Impacto

No se puede saber si el bot respondió bien o mal. El QA falla por falta de captura, no necesariamente porque el bot no tenga lógica.

### Corrección

Después de enviar cada mensaje de prueba, el runner QA debe esperar hasta encontrar un mensaje saliente real.

### Criterio de aceptación

El paso no debe evaluarse hasta que exista al menos un mensaje:

```sql
direction = 'outbound'
```

asociado al lead y posterior al mensaje inbound probado.

---

## 2.2 El QA no lee correctamente `messages.direction = outbound`

### Qué ocurre

El QA no está tomando la respuesta final desde la tabla `messages`, o está leyendo un registro incorrecto.

### Corrección recomendada

Después de cada mensaje del cliente, buscar el último mensaje outbound del lead:

```sql
SELECT
  id,
  lead_id,
  direction,
  content,
  created_at,
  provider_message_id,
  status,
  provider_status
FROM public.messages
WHERE lead_id::text = '{{lead_id}}'
  AND direction = 'outbound'
ORDER BY created_at DESC
LIMIT 1;
```

### Criterio de aceptación

El campo del QA:

```json
"bot"
```

debe llenarse con el contenido real del último mensaje outbound.

---

## 2.3 No se registra ni devuelve auditoría real

### Qué ocurre

El QA muestra:

```json
"audit": {
  "decision": null,
  "flow_name": null,
  "idempotency_key": null
}
```

### Impacto

No se puede depurar qué workflow tomó la decisión, qué acción se ejecutó ni si se aplicó idempotencia.

### Corrección recomendada

Cada ejecución debe registrar y/o devolver:

```json
{
  "audit": {
    "flow_name": "action_executor",
    "decision": {
      "action": "send_quote",
      "reason": "Cliente entregó servicio, comuna y vehículo"
    },
    "idempotency_key": "lead_id__message_id__send_quote"
  }
}
```

### Criterio de aceptación

Cada paso QA debe mostrar:

- `audit.flow_name`
- `audit.decision.action`
- `audit.idempotency_key`

---

## 2.4 El QA permite aprobar pasos con `bot = null`

### Qué ocurre

Algunos pasos aparecen como `passed: true` aunque no existe respuesta del bot.

### Problema

Un paso sin respuesta del bot no debería aprobar, salvo que el escenario sea explícitamente de silencio controlado, lo cual no aplica en estos tests comerciales.

### Corrección recomendada

Agregar validación dura:

```js
if (!bot || String(bot).trim() === "") {
  passed = false;
  errors.push("bot es null o vacío");
}
```

### Criterio de aceptación

Ningún paso puede tener:

```json
"passed": true,
"bot": null
```

---

## 2.5 El QA permite aprobar pasos sin respuesta ni cambio de estado

### Qué ocurre

Hay pasos donde no hubo respuesta, no hubo acción, no hubo actualización de estado, pero aun así el QA los considera aprobados.

### Corrección recomendada

Validar al menos una señal real de procesamiento:

```js
const hasBotResponse = bot && String(bot).trim() !== "";

const hasAction =
  state &&
  state.last_bot_action &&
  String(state.last_bot_action).trim() !== "";

const stateChanged =
  previousState.stage !== currentState.stage ||
  previousState.next_goal !== currentState.next_goal ||
  previousState.service_interest !== currentState.service_interest ||
  previousState.vehicle_type !== currentState.vehicle_type ||
  previousState.district !== currentState.district;

if (!hasBotResponse && !hasAction && !stateChanged) {
  passed = false;
  errors.push("No hubo respuesta, acción ni cambio de estado");
}
```

### Criterio de aceptación

Un paso solo puede aprobar si existe al menos una de estas condiciones:

- respuesta outbound real
- acción ejecutada
- cambio de estado relevante
- auditoría registrada

---

# 3. Fallas de persistencia de estado

## 3.1 El estado no guarda `service_interest`

### Qué ocurre

El cliente dice:

```text
lavado premium
premium
lavado profundo
encerado full
```

pero el estado sigue:

```json
"service_interest": null
```

### Impacto

El bot no puede cotizar ni avanzar comercialmente.

### Corrección

Normalizar y guardar el servicio detectado en `lead_state.service_interest`.

---

## 3.2 El estado no guarda `district`

### Qué ocurre

El cliente entrega comuna:

```text
Huechuraba
Las Condes
```

pero el estado sigue:

```json
"district": null
```

### Impacto

No se puede calcular precio, recargo ni cobertura.

### Corrección

Detectar comuna y persistirla en `lead_state.district`.

---

## 3.3 El estado no guarda `vehicle_type`

### Qué ocurre

El cliente entrega tipo de vehículo:

```text
SUV
suv
camioneta
hatchback
sedán
auto chico
```

pero el estado sigue:

```json
"vehicle_type": null
```

### Impacto

No se puede cotizar.

### Corrección

Normalizar alias de vehículo y guardar el valor estándar.

---

## 3.4 `last_bot_action` no se actualiza

### Qué ocurre

El estado mantiene:

```json
"last_bot_action": null
```

### Impacto

El bot no sabe qué hizo antes. Por eso no puede interpretar correctamente respuestas como:

```text
sí
dale
agendemos
lo voy a pensar
```

### Corrección

Cada acción ejecutada debe actualizar:

```json
"last_bot_action": "send_quote"
```

o la acción correspondiente.

---

## 3.5 `stage` y `next_goal` quedan pegados

### Qué ocurre

El estado se mantiene en:

```json
"stage": "new_lead",
"next_goal": "qualify_lead"
```

aunque el cliente ya entregó datos o pidió agendar.

### Corrección

Actualizar estado según avance comercial:

```json
{
  "stage": "quoted",
  "next_goal": "book_appointment"
}
```

o:

```json
{
  "stage": "booking_selection",
  "next_goal": "select_booking_slot"
}
```

---

# 4. Fallas de cotización

## 4.1 No cotiza aunque ya tiene servicio, comuna y vehículo

### Escenarios afectados

- `cotizacion_premium_servicio_comuna_vehiculo`
- `cotizacion_premium_servicio_vehiculo_comuna`
- `cotizacion_basico_hatchback`
- `cotizacion_encerado_sedan`
- `vehiculo_suv_minuscula`
- `vehiculo_camioneta_premium`

### Regla esperada

Si existen:

```text
service_interest
district
vehicle_type
```

entonces debe ejecutarse:

```text
send_quote
```

### Estado esperado después de cotizar

```json
{
  "stage": "quoted",
  "next_goal": "book_appointment",
  "last_bot_action": "send_quote"
}
```

---

## 4.2 No pide correctamente datos faltantes

### Escenarios afectados

- `pide_valor_sin_servicio`
- `pide_valor_sin_comuna`
- `pide_valor_sin_vehiculo`

### Comportamiento esperado

Si falta servicio:

```text
Para darte el valor exacto, dime qué servicio te interesa: lavado básico, lavado premium o encerado full.
```

Si falta comuna:

```text
Perfecto. ¿En qué comuna sería el servicio?
```

Si falta vehículo:

```text
Perfecto. ¿Qué tipo de vehículo tienes? Por ejemplo: hatchback, sedán, SUV o camioneta.
```

---

## 4.3 Alias de servicios no están normalizados

### Casos detectados

```text
lavado profundo
lavado esencial
mantención
premium
encerado
```

### Mapeo recomendado

```js
const serviceAliasMap = {
  "lavado profundo": "lavado_premium",
  "profundo": "lavado_premium",
  "lavado esencial": "lavado_basico",
  "esencial": "lavado_basico",
  "mantención": "lavado_basico",
  "lavado de mantención": "lavado_basico",
  "premium": "lavado_premium",
  "encerado": "encerado_full",
  "encerado full": "encerado_full"
};
```

---

## 4.4 Alias de vehículos no están normalizados

### Casos detectados

```text
suv
SUV
camioneta
hatchback
sedán
auto chico
```

### Mapeo recomendado

```js
const vehicleAliasMap = {
  "suv": "suv",
  "SUV": "suv",
  "camioneta": "camioneta",
  "pickup": "camioneta",
  "hatchback": "hatchback",
  "auto chico": "hatchback",
  "sedan": "sedan",
  "sedán": "sedan",
  "auto": "sedan"
};
```

---

# 5. Fallas de agenda y cierre

## 5.1 Después del precio, el “sí” no avanza a horarios

### Escenarios afectados

- `acepta_precio_si`
- `acepta_precio_dale`
- `quiere_agendar_despues_cotizacion`

### Comportamiento esperado

Si el cliente ya recibió cotización y responde:

```text
sí
dale
agendemos
quiero agendar
```

debe ejecutarse:

```text
offer_available_slots
```

### Regla recomendada

```js
if (
  last_bot_action === "send_quote" &&
  next_goal === "book_appointment" &&
  isPositiveBookingIntent(message)
) {
  action = "offer_available_slots";
}
```

---

## 5.2 El bot no ofrece horarios cuando el cliente los pide

### Escenarios afectados

- `pide_horarios_con_contexto`
- `pide_horarios_proxima_semana`

### Comportamiento esperado

Si el cliente pregunta:

```text
qué horarios tienes?
tienes horarios para la próxima semana?
```

debe ejecutarse:

```text
offer_available_slots
```

---

## 5.3 No maneja fecha manual propuesta por el cliente

### Escenario afectado

- `fecha_manual_cliente`

### Cliente

```text
quiero este jueves a las 9
```

### Comportamiento esperado

El sistema debe validar disponibilidad con calendario o responder con alternativas.

Acción esperada:

```text
check_calendar_slot
```

o:

```text
offer_available_slots
```

---

## 5.4 No procesa selección de horario por número

### Escenarios afectados

- `selecciona_horario_opcion_1`
- `selecciona_horario_opcion_2`
- `seleccion_horario_invalida`

### Comportamiento esperado

Si el estado es:

```json
"stage": "booking_selection"
```

y el cliente responde:

```text
1
2
3
```

el bot debe mapear la opción contra `booking_options`.

### Regla recomendada

```js
if (stage === "booking_selection" && isNumericOption(message)) {
  if (optionExists(message, booking_options)) {
    action = "confirm_booking";
  } else {
    action = "offer_available_slots";
    message = "Esa opción no está disponible. Puedes elegir 1, 2 o 3.";
  }
}
```

---

# 6. Fallas de dirección

## 6.1 No confirma dirección completa

### Escenario afectado

- `confirma_direccion_completa`

### Cliente

```text
Av. Pedro Fontova 7450, Huechuraba, casa con portón negro
```

### Acción esperada

```text
confirm_address
```

---

## 6.2 No pide referencia cuando la dirección viene incompleta

### Escenario afectado

- `direccion_sin_referencia`

### Cliente

```text
Pedro Fontova 7450
```

### Acción esperada

```text
collect_address
```

### Respuesta esperada

```text
Perfecto, tengo la dirección. ¿Me podrías dejar una referencia para ubicar mejor el domicilio?
```

---

## 6.3 No corrige dirección cuando el cliente se equivoca

### Escenario afectado

- `cambia_direccion`

### Cliente

```text
me equivoqué, es Pedro Fontova 7550
```

### Acción esperada

```text
confirm_address
```

### Estado esperado

Actualizar la dirección anterior y no crear una dirección duplicada.

---

# 7. Fallas en preguntas frecuentes

## 7.1 Preguntas de servicios

### Escenarios afectados

- `pregunta_incluye_basico`
- `pregunta_incluye_premium`
- `compara_basico_premium`
- `menu_servicios`
- `menu_servicios_directo`

### Mejora recomendada

Estas preguntas deberían resolverse con respuestas fijas o semiestructuradas en `rules_engine` o `answer_question`.

---

## 7.2 Preguntas operativas

### Escenarios afectados

- `pregunta_duracion_servicio`
- `pregunta_forma_pago`
- `pregunta_servicio_domicilio`
- `pregunta_materiales_agua_luz`

### Mejora recomendada

Crear respuestas base para:

- duración del servicio
- formas de pago
- si el servicio es a domicilio
- si necesitan agua o electricidad

---

## 7.3 Preguntas por servicios no soportados

### Escenario afectado

- `servicio_no_soportado_moto`

### Cliente

```text
lavan motos?
```

### Comportamiento recomendado

Responder con claridad si se atienden o no motos. Si no está definido, derivar a humano o indicar que se revisará.

---

# 8. Fallas en objeciones comerciales

## 8.1 Objeción de precio caro

### Escenario afectado

- `objecion_precio_caro`

### Cliente

```text
está caro
```

### Acción esperada

```text
answer_objection
```

### Estado esperado

```json
{
  "stage": "objection",
  "next_goal": "book_appointment"
}
```

---

## 8.2 Cliente tiene otra opción más barata

### Escenario afectado

- `objecion_otra_opcion_mas_barata`

### Cliente

```text
tengo otro que me cobra menos
```

### Acción esperada

```text
answer_objection
```

### Enfoque comercial sugerido

Responder desde valor, calidad, detalle, atención a domicilio y terminación, sin atacar a la competencia.

---

## 8.3 Cliente dice que lo pensará

### Escenarios afectados

- `objecion_lo_pensare`
- `cliente_desaparece_despues_cotizacion`

### Cliente

```text
lo voy a pensar
después te aviso
```

### Acción esperada

```text
schedule_followup
```

### Estado esperado

```json
{
  "stage": "quoted",
  "next_goal": "follow_up"
}
```

---

# 9. Fallas en cancelación y reprogramación

## 9.1 No reconoce intención de cancelar

### Escenarios afectados

- `cancelar_reserva_conversacion_nueva`
- `cancelar_sin_reserva`

### Cliente

```text
quiero cancelar mi reserva
cancela la hora que tenía
```

### Acción esperada

```text
cancel_booking
```

o, si no existe reserva:

```text
answer_question
```

con mensaje indicando que no se encontró una reserva activa.

---

## 9.2 No reconoce intención de reprogramar

### Escenarios afectados

- `reprogramar_reserva`
- `reprogramar_fecha_especifica`

### Cliente

```text
quiero cambiar la hora de mi reserva
puedo cambiar mi reserva para el próximo martes?
```

### Acción esperada

```text
reschedule_booking
```

o:

```text
offer_available_slots
```

si necesita mostrar nuevas opciones.

---

# 10. Fallas de handoff humano

## 10.1 No deriva cuando el cliente pide una persona

### Escenario afectado

- `handoff_pide_persona`

### Cliente

```text
quiero hablar con una persona
```

### Acción esperada

```text
handoff_human
```

### Estado esperado

```json
{
  "stage": "human_handoff",
  "human_handoff": true
}
```

---

## 10.2 No deriva reclamos

### Escenario afectado

- `handoff_reclamo`

### Cliente

```text
tuve un problema con el servicio y quiero hablar con alguien
```

### Acción esperada

```text
handoff_human
```

### Mejora recomendada

Los reclamos deben ser regla dura, no depender del LLM.

---

# 11. Fallas post-servicio

## 11.1 No pide reseña cuando el cliente queda feliz

### Escenario afectado

- `post_servicio_cliente_feliz_review`

### Cliente

```text
quedó muy bueno el lavado, gracias
```

### Acción esperada

```text
request_review
```

---

## 11.2 No maneja referidos

### Escenario afectado

- `referido_cliente_pregunta`

### Cliente

```text
te puedo recomendar con un amigo?
```

### Acción esperada

```text
request_referral
```

---

# 12. Orden recomendado de reparación

## Fase 1 — Reparar base del QA

1. Esperar respuesta real del bot.
2. Leer último mensaje `outbound`.
3. Registrar auditoría real.
4. Fallar si `bot = null`.
5. No aprobar pasos sin respuesta ni cambio de estado.

## Fase 2 — Reparar estado

6. Guardar `service_interest`.
7. Guardar `district`.
8. Guardar `vehicle_type`.
9. Guardar `last_bot_action`.
10. Actualizar `stage`.
11. Actualizar `next_goal`.
12. Evitar sobrescribir campos con `null`.

## Fase 3 — Reparar cotización

13. Ejecutar `send_quote` cuando estén servicio, comuna y vehículo.
14. Normalizar alias de servicios.
15. Normalizar alias de vehículos.
16. Manejar comunas fuera de zona.
17. Guardar cotización y dejar `stage = quoted`.

## Fase 4 — Reparar agenda

18. Ejecutar `offer_available_slots` después de aceptación.
19. Mostrar horarios cuando el cliente los pida.
20. Guardar `booking_options`.
21. Procesar respuestas `1`, `2`, `3`.
22. Manejar opción inválida.
23. Pedir/confirmar dirección.

## Fase 5 — Reparar flujos comerciales avanzados

24. Preguntas frecuentes.
25. Objeciones.
26. Seguimientos.
27. Cancelación.
28. Reprogramación.
29. Handoff humano.
30. Reseñas.
31. Referidos.

---

# 13. Conclusión

La prioridad real es reparar el circuito de QA y trazabilidad.

Mientras el sistema muestre:

```json
"bot": null,
"decision": null,
"flow_name": null,
"idempotency_key": null
```

no se puede confiar completamente en los resultados de las pruebas.

Una vez resuelto eso, se debe corregir la persistencia del estado. Después recién conviene atacar los flujos comerciales como cotización, horarios, dirección, objeciones, cancelación, reprogramación, handoff, reseñas y referidos.

El orden correcto es:

```text
QA / ejecución
→ estado
→ cotización
→ agenda
→ dirección
→ objeciones y FAQs
→ cancelación / reprogramación / handoff
→ post-servicio
```
