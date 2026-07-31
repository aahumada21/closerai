# Plan de escenarios QA "inconsistencia" — 2026-07-21

Segunda tanda, siguiendo el mismo criterio que `QA_BASE_SCENARIOS_PLAN_2026-07-18.md`:
conversaciones de varios turnos que encadenan pasos reales para evitar setup redundante,
derivadas de las reglas que quedaron deliberadamente afuera de `base` por ser casos de
**usuario ambiguo, contradictorio, o que cambia de opinion a mitad de flujo** (no errores
tecnicos duros -- esos van en la tanda `errores`).

Prefijo propuesto para esta tanda: **`5693400000`** (distinto de `5693300000` de `base`,
mismo esquema `56990...` solo para los que necesiten fixture encadenado dentro del mismo
escenario, igual que aprendimos con `base`: **no se puede pre-sembrar estado por SQL
externo, `prepare_qa_lead` lo resetea siempre** -- todo lo que necesite una reserva previa
tiene que construirse con pasos anteriores del mismo escenario).

Esto es el plan, no el JSON cargable todavia.

---

## 5693400001 — Cambio de servicio antes de reservar (sin reserva activa)

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero el lavado basico en Providencia, tengo un sedan" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Mejor cambiemos a un SUV" | `rule_vehicle_change_needs_confirmation` | `ask_missing_data` |
| 3 | "Si, es un SUV" | `rule_commercial_field_changed_requote` | `send_quote` |

## 5693400002 — Cambio de servicio DESPUES de reservar (cancelar + reagendar)

Encadenado sobre una reserva construida en el mismo escenario (mismo patron que
`5699033001` de base).

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1-6 | (mismo flujo de agenda completo que 5693300001 de base) | — | hasta `confirm_booking` |
| 7 | "Mejor quiero cambiar al lavado premium" | `rule_change_service_ask_target` | `answer_question` |
| 8 | "El lavado premium" | `rule_service_change_target_provided` | `answer_question` |
| 9 | "Dale, cancela y agenda el premium" | `rule_confirm_service_change_cancel_and_rebook` | `cancel_booking` |

## 5693400003 — Saludo / agradecimiento con reserva activa (no repetir spam)

Encadenado sobre una reserva construida en el mismo escenario.

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1-6 | (mismo flujo de agenda completo) | — | hasta `confirm_booking` |
| 7 | "Hola!" | `rule_greeting_with_active_booking` | `answer_question` |
| 8 | "Dale, gracias" | `rule_already_booked_acknowledgment` | `answer_question` |

## 5693400004 — Direccion sin numero, corrige, y la cambia durante confirmacion

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero el lavado basico, sedan, Providencia" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Quiero agendar" | (auto-select prepago_only) | `offer_available_slots` |
| 3 | "1" | `rule_select_slot_collect_address` | `collect_address` |
| 4 | "Avenida Providencia" (sin numero) | `rule_address_missing_number` | `ask_missing_data` |
| 5 | "Av Providencia 1234" | `rule_confirm_address_if_waiting_address` | `confirm_address` |
| 6 | "En realidad es Av Apoquindo 4500" | `rule_address_correction_during_confirmation` | `ask_missing_data` |

**Nota**: paso 6 requiere `stage=booking_confirmation` -- verificar que el paso 5
efectivamente deje ese stage antes de cargarlo (si no, puede caer en otra regla).

## 5693400005 — Direccion no reconocible, se agotan los intentos -> handoff

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero el lavado basico, sedan, Nunoa" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Quiero agendar" | (auto-select prepago_only) | `offer_available_slots` |
| 3 | "1" | `rule_select_slot_collect_address` | `collect_address` |
| 4 | "cerca del mall" (sin numero ni palabra de direccion) | `rule_confirm_address_not_clear` | `collect_address` |
| 5 | "no se cual es" | `rule_address_collection_attempts_exhausted` | `handoff_human` |

## 5693400006 — Seleccion de horario invalida / dia correcto pero hora equivocada

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola quiero el lavado basico, sedan, Las Condes" | `rule_price_with_complete_context_immediate` | `send_quote` |
| 2 | "Quiero agendar" | (auto-select prepago_only) | `offer_available_slots` |
| 3 | "el 10" (opcion que no existe) | `rule_invalid_booking_option_selected` | `answer_question` |
| 4 | "jueves a las 20:00" (dia ofrecido, hora que no calza) | `rule_booking_day_matches_but_time_does_not` | `answer_question` |

## 5693400007 — Pregunta FAQ no reconocida en lead nuevo

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Hola, hacen descuento por flota de autos?" | `rule_unknown_faq` | `ask_missing_data` |

**Nota**: requiere ser el PRIMER mensaje del lead (`stage=new_lead` exacto) -- no se puede
combinar con otros pasos antes.

## 5693400008 — Handoff bloqueado (lead ya derivado no debe reabrir el flujo normal)

| # | Mensaje | rule_key esperado | action esperada |
|---|---|---|---|
| 1 | "Quiero hablar con una persona del equipo" | `rule_explicit_human_request` | `handoff_human` |
| 2 | "Hola, siguen ahi?" | `rule_human_handoff_locked` | `answer_question` |

---

## Deliberadamente NO incluidas (necesitan verificacion previa o no aplican)

- **`rule_staff_selection_reply_*`**: solo aplica si el negocio tiene mas de un
  `agent_staff` activo con `staff_selection_mode=ask_customer`. No verifique si Ahumada
  Detailing tiene mas de un staff configurado -- si no, esta regla es inalcanzable en
  produccion y no vale la pena generarle un escenario.
- **`rule_returning_customer_reactivation`**: no revise las condiciones exactas de
  `leadState` que la disparan (probablemente requiere historial de servicio previo /
  `stage=post_service` o similar) -- queda pendiente de investigar antes de armar el
  escenario para no adivinar mal como paso con el `payment_mode` la vez pasada.
- **`rule_affirmative_after_price_list_ask_service`** / **`rule_service_selected_after_price_list`**:
  son variantes de fraseo de flujos ya cubiertos en `base` (lista de precios -> elegir
  servicio) -- de bajo valor marginal, se pueden agregar despues si se quiere mas cobertura
  fina de fraseo.
- **`rule_multi_vehicle_faq`**: tecnicamente ya la tocamos indirectamente al arreglar el
  bug de `answer_faq` -- un escenario dedicado ("puedes lavar dos autos al mismo tiempo?")
  seria mas bien un test de regresion de ese fix, podria ir en la tanda `errores` en vez
  de aca.

## Siguiente paso

Si este plan te sirve, sigo con `errores` (mensajes vacios, adjuntos no soportados,
`rule_manual_slot_availability_check`, y tests de regresion de los 4 bugs arreglados hoy),
o convierto directamente esta lista en JSON cargable como hicimos con `base`.

## Resultado (2026-07-21, ejecutado de forma autonoma durante la noche)

**8/8 escenarios, 37/37 pasos, 100% PASS.** JSON cargado en `qa_test_scenarios_temp`
(prefijo `5693400000`, `category='inconsistencia'`).

Cambios respecto al plan original, todos verificados leyendo directamente
`rules_evaluation.js` antes de generar el JSON (no se adivino ningun rule_key):

- **5693400001 paso 1**: el `rule_key` documentado arriba (`rule_price_with_complete_context_immediate`)
  es incorrecto -- esa regla requiere lenguaje de precio explicito (`userAsksPrice`) que
  el mensaje planeado no tiene. La regla real que dispara para "todo en un mensaje, lead
  nuevo, sin lenguaje de precio" es `rule_send_quote_when_commercial_context_complete`
  (misma `action: send_quote`, el `expect` del JSON no se vio afectado).
- **5693400007 paso 1**: el mensaje original ("hacen descuento por flota de autos?")
  matchea el topico conocido `discounts` de `rule_business_faq_router` (prioridad mas
  alta que `rule_unknown_faq`), asi que NO hubiera sido una FAQ "desconocida". Se
  cambio a "Que pasa si llueve el dia de mi cita?", verificado contra los 9 topicos de
  `getBusinessFaqTopic` para confirmar que ninguno matchea.
- **5693400002**: se elimino el paso "El lavado premium" (originalmente paso 8) --
  cuando el mensaje que pide el cambio de servicio ya nombra el servicio nuevo
  explicitamente (como en este escenario), `ruleChangeServiceRequiresCancelRebook`
  salta directo a pedir confirmacion si/no, no a preguntar "a cual servicio". El paso
  extra terminaba siendo una respuesta fuera de guion a una pregunta de confirmacion,
  sin ninguna regla que la cubra (cae al fallback LLM) -- ver el gap documentado en
  `bot_decision_tree.yaml` (`known_gaps`, bajo impacto, no arreglado). El paso 9
  original ("Dale, cancela y agenda el premium") ya cumplia el rol de confirmacion.
- **5693400008 paso 2**: la `action` esperada se corrigio de `answer_question` a
  `handoff_human`. `rule_human_handoff_locked` en el codigo fuente devuelve
  `action: answer_question`, pero `action_executor` tiene un guard
  (`action_executor_guard_handoff_lock`) que fuerza `handoff_human` como action final
  cuando el lead esta en handoff_lock -- comportamiento correcto y deliberado del bot,
  el error era de expectativa del test (asumir que la action de la regla en
  `rules_engine` es siempre la action terminal, sin considerar guards de
  `action_executor`). Documentado en `bot_decision_tree.yaml`.

No se encontraron bugs reales de bot en esta tanda (a diferencia de `base`, que encontro
4). Si se encontro un bug real de infraestructura de QA (el batch runner corta despues
del primer escenario) -- ver seccion dedicada en `QA/decision_tree/README.md`.
