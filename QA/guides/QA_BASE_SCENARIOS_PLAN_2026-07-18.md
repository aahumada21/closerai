# Plan de escenarios QA "base" — 2026-07-18

Lista de escenarios a generar para la categoria `base` (camino feliz / funcionalidad
principal), derivada directamente de `QA/decision_tree/*.yaml`. Cada escenario es una
**conversacion de varios turnos** que encadena pasos reales — si un paso ya deja al lead
en el estado que otra regla necesita, se sigue desde ahi en el MISMO escenario en vez de
crear un escenario nuevo que repita "hola, quiero agendar..." desde cero. Cada escenario
usa un `scenario_key` unico con el prefijo nuevo `5693300000` y `category: "base"`.

No es SQL/JSON todavia cargable en `qa_test_scenarios_temp` — es el plan para revisar
antes de convertirlo en escenarios reales (falta decidir el `expect`/`expected_outcome`
exacto de cada paso, que es el siguiente paso una vez que este plan este aprobado).

## Convenciones de esta tabla

- **rule_key**: el nombre exacto de la regla en `bot_decision_tree.yaml` -> `rule_chain`
  que se espera que dispare ese paso (trazabilidad directa al arbol de decision).
- Un mismo escenario puede necesitar un **fixture previo** (ej. una reserva activa ya
  creada por SQL) en vez de generarlo por conversacion, precisamente para NO repetir el
  flujo de agenda completo solo para poder probar cancelar/reagendar/consultar.

---

## 5693300001 — Descubrimiento -> Cotizacion -> Agenda -> Direccion -> Confirmacion

El flujo principal de punta a punta. Cubre 6 acciones distintas en un solo hilo de
conversacion real.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola, quiero el lavado premium" | `rule_missing_required_fields` (fallback) | `ask_missing_data` (pide comuna) |
| 2 | "Vivo en Las Condes, tengo un SUV" | `rule_send_price_list_when_vehicle_and_district_ready` | `send_quote` |
| 3 | "Dale, quiero agendar" | ver nota payment_mode abajo | `offer_available_slots` (asumiendo auto-select) |
| 4 | "El jueves a las 15:00" | `rule_select_slot_collect_address` | `collect_address` |
| 5 | "Mi direccion es Av. Apoquindo 4500" | `rule_confirm_address_if_waiting_address` | `confirm_address` |
| 6 | "Si, confirmo la reserva" | `rule_confirm_booking_from_user_confirmation` | `confirm_booking` |

**Nota payment_mode**: el paso 3 depende de `agent_business_config.payment_mode`. Si esta
en modo "preguntar" (no auto-select), el paso 3 en realidad dispara `rule_ask_payment_preference`
(`ask_payment_preference`) en vez de ir directo a slots — ver 5693300002, que prueba esa
rama especificamente. **Antes de cargar este escenario, confirmar el `payment_mode` real
configurado** para no asumir mal cual rama va a disparar.

## 5693300002 — Preferencia de pago explicita

Prueba especificamente la rama de "preguntar metodo de pago" (si el negocio esta
configurado para preguntar en vez de auto-seleccionar). No repite el tramo final de
direccion/confirmacion porque ya quedo cubierto en 5693300001.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero cotizar el lavado basico para mi hatchback en Nunoa" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Quiero reservar" | `rule_ask_payment_preference` | `ask_payment_preference` |
| 3 | "Prefiero pagar al terminar el servicio" | (rama de `rule_payment_preference_unclear` / preferencia reconocida en `rulePaymentPreferenceSelected`) | `offer_available_slots` |

## 5693300003 — Cancelar reserva

**Requiere fixture**: lead_state con una reserva activa ya creada por SQL (no por
conversacion — cancelar ya se prueba solo, no hace falta re-agendar primero).

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Quiero cancelar mi reserva del jueves" | `rule_cancel_booking` | `cancel_booking` |

## 5693300004 — Reagendar reserva

**Requiere fixture**: idem 5693300003, reserva activa preexistente.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Necesito cambiar mi hora, puede ser el viernes?" | `rule_reschedule_booking` | `reschedule_booking` |

## 5693300005 — Preguntas frecuentes / informativas

Varias preguntas independientes (no dependen de estado previo entre si), agrupadas en un
solo hilo para no crear 5 escenarios sueltos.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Eres un bot o hablo con una persona?" | `rule_is_bot_disclosure` | `ask_missing_data` (disclosure) |
| 2 | "Que servicios tienen?" | `rule_service_menu_request` | `send_service_menu` |
| 3 | "Que incluye el lavado premium?" | `rule_service_details` | `answer_question` |
| 4 | "Atienden los domingos?" | `rule_weekday_availability_question` | `answer_question` |
| 5 | "Cubren la comuna de Maipu?" | `rule_coverage_question` | `answer_question` |

## 5693300006 — Recomendacion de servicio

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Mi auto esta muy sucio, tiene barro y manchas por todos lados" | `rule_recommend_premium_when_very_dirty` | `ask_missing_data` |
| 2 | "No se que servicio elegir, que me recomiendas?" | `rule_recommend_service_request` | `recommend_service` |

## 5693300007 — Objecion / alternativa mas barata / seguimiento

Encadena la familia completa de "no esta convencido" sin repetir la apertura de otros
escenarios.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero cotizar el encerado full, tengo un sedan en La Reina" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Uy que caro, tienen algo mas barato?" | `rule_cheaper_alternative_request` | `send_quote` |
| 3 | "Lo voy a pensar" | `rule_objection_will_think` | `answer_objection` |
| 4 | "Mejor avisame despues" | `rule_schedule_followup_after_quote` | `schedule_followup` |

## 5693300008 — Rechazo de horarios ofrecidos

Necesita llegar a `booking_selection` con horarios ya ofrecidos, asi que el arranque se
parece al de 5693300001 -- es la unica superposicion real porque es un precondition
inevitable (no se puede rechazar horarios sin que se hayan ofrecido), no una duplicacion
de lo que ya prueba 5693300001 (ahi nunca se rechaza nada).

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero el lavado basico, city car, Nunoa" | `rule_send_price_list_when_vehicle_and_district_ready` | `send_quote` |
| 2 | "Dale, quiero agendar" | (idem nota payment_mode) | `offer_available_slots` |
| 3 | "No, ninguno de esos horarios me sirve" | `rule_decline_offered_slots` | `answer_objection` |

## 5693300009 — Derivacion explicita a humano

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Quiero hablar con una persona del equipo, por favor" | `rule_explicit_human_request` | `handoff_human` |

## 5693300010 — Reclamo

Distinto de 5693300009: el disparador (texto con "reclamo") y el efecto en el estado
(fuerza `stage=human_handoff` directo) son ambos distintos, vale la pena probarlos
separado.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Tengo un reclamo, el servicio del otro dia quedo pesimo" | `rule_customer_complaint_handoff` | `answer_question` (efecto real: handoff) |

## 5693300011 — Post-servicio: resena + referido

**Requiere fixture**: lead_state en `stage=post_service` (servicio ya completado).

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Quedo increible el auto, quede muy conforme!" | `rule_positive_post_service_feedback` | `request_review` |
| 2 | "Le voy a contar a mi hermana para que tambien los llame" | `rule_referral_intent` | `request_referral` |

## 5693300012 — Consulta de reserva existente

**Requiere fixture**: reserva activa preexistente.

| # | Mensaje del usuario | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Tengo alguna reserva agendada?" | `rule_check_existing_appointment_has_one` | `answer_question` |

---

## Reglas/acciones deliberadamente NO incluidas en "base" (quedan para `inconsistencia` / `errores`)

Casos borde, guards de seguridad, y variantes de frase redundantes con lo ya cubierto
arriba -- no se duplican aca:

`rule_human_handoff_locked`, `rule_empty_message`, `rule_confirm_service_change_cancel_and_rebook`,
`rule_vehicle_rural_clarification_resolved`, `rule_staff_selection_reply_*`,
`rule_already_booked_acknowledgment`, `rule_greeting_with_active_booking`,
`rule_acknowledge_after_pre_service_instructions`, `rule_change_service_*`,
`rule_service_change_target_provided`, `rule_requote_on_changed_commercial_field*`,
`rule_vehicle_rural_needs_clarification`, `rule_address_correction_during_confirmation`,
`rule_attachment_not_supported`, `rule_unknown_faq`, `rule_multi_vehicle_faq`,
`rule_manual_slot_availability_check*`, `rule_returning_customer_*`,
ramas de error de `rule_confirm_address_if_waiting_address` (abandono, intentos agotados,
numero faltante, direccion no clara), ramas ambiguas/invalidas de `rule_select_offered_slot`,
`rule_affirmative_after_price_list_ask_service`, `rule_service_selected_after_price_list`.

## No testeable via conversacion de chat (no entra en ningun escenario)

- `offer_booking`, `send_pre_service_instructions`, `notify_on_the_way`: no los emite
  `rules_engine` directamente (ver `known_gaps`/notas en `bot_decision_tree.yaml` y
  `action_subflows.yaml`) -- se disparan por LLM o por accion externa (staff/scheduler),
  no por un mensaje de usuario simulable en `qa_run_webhook.ps1`.
- Confirmacion de pago (`6.27 payment_confirmed_webhook`): es un webhook HTTP de Flow.cl,
  no un mensaje de chat -- no se puede probar con el runner de QA actual (necesitaria un
  mecanismo de test distinto, ej. golpear el webhook directo).

## Siguiente paso

Si este plan te sirve, el siguiente paso es convertir cada tabla en el JSON real que
consume `scripts/qa_generate_scenarios.ps1` (`scenario_key/name/suite/priority/tags/steps/
category/expected_outcome`), decidiendo el `expected_outcome` (o `expect` por paso) de
cada fila. Antes de cargarlo a la DB conviene:
1. Confirmar el `payment_mode` real configurado (afecta 5693300001 y 5693300008).
2. Preparar los fixtures SQL necesarios para 5693300003, 5693300004, 5693300011 y
   5693300012 (reserva activa / stage=post_service preexistente).
