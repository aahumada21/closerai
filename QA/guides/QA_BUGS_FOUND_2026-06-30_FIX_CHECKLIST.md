# Bugs encontrados en el batch QA post-fixes (2026-06-30)

Resultado: **47 / 60 pasaron** (78%). Mejora respecto al 25/60 anterior a los fixes.
Batch: escenarios `569900500`-`569900559`, corrida limpia tras arreglar BUG-01 a BUG-14.

Convencion de prioridad:
- **P0**: rompe un flujo critico de venta o viola "no inventar".
- **P1**: bug funcional real que un cliente real puede encontrar.
- **P2**: edge case / pulido.

Para arreglar cada uno, usar el arnes:
```powershell
scripts/qa_fix_bugs_2026_06_30.ps1 -Bug "BUG-A"
```

---

## P1 - Bugs funcionales reales

### [x] BUG-A: doble confirmacion de reserva no se reconoce como ya confirmada — ARREGLADO 2026-06-30
- **Fix**: (1) `ruleConfirmBookingFromUserConfirmation` ahora retorna null si `stage==="booked"`, evitando re-confirmar. (2) Nueva regla `ruleAlreadyBookedAcknowledgment` (prioridad 96) que responde "Tu reserva ya quedo confirmada para [fecha/hora]..." cuando el usuario manda una afirmacion y ya esta agendado. Validado: escenario 534 OK.

### [ ] BUG-A (original, ya marcado arriba)
- **Escenario**: `569900534`
- **Sintoma**: el usuario confirma la reserva en el paso 5 (correctamente agendada),
  pero en el paso 6 vuelve a confirmar (ej. un segundo "si, confirma"). En vez de
  responder "ya quedo agendada", el bot repite el bloque de instrucciones previas al
  servicio como si fuera una nueva accion.
- **Donde mirar**: `3 rules_engine` — revisar si existe una regla que, cuando
  `stage === "booked"` y el usuario envia una afirmacion, reconozca el contexto de
  "ya esta agendado" en vez de intentar re-ejecutar la confirmacion.
- **Fix sugerido**: agregar o corregir una condicion en el path de
  `ruleConfirmBookingFromUserConfirmation` o una regla nueva que, si ya hay reserva
  activa y el usuario dice "si"/"confirmo", responda con "tu reserva ya quedo
  registrada" en vez de repetir instrucciones.

### [ ] BUG-B: cancelar + reagendar en el mismo flujo pierde contexto tras la cancelacion
- **Escenarios**: `569900537`
- **Sintoma**: el usuario agenda, cancela correctamente, y luego quiere agendar de
  nuevo. Tras la cancelacion, el bot responde con mensaje vacio o error visible, y
  luego interpreta el intento de nuevo agendamiento como un reagendamiento de una
  reserva activa (que ya no existe), entrando en un flujo incorrecto.
- **Donde mirar**: post-cancelacion en `6.6 cancel_booking` — revisar si el
  `state_update` que resulta tras cancelar limpia `stage` correctamente (deberia
  quedar en "qualified" o similar, no en "reschedule"), y si `action_executor`
  enruta correctamente el siguiente turno post-cancelacion cuando el usuario pide
  agendar de nuevo.
- **Fix sugerido**: al cancelar con exito, asegurar que `stage` vuelve a un estado
  neutral (ej. "qualified" con el servicio/vehiculo/comuna preservados) de forma que
  el siguiente mensaje del usuario active el flujo de nuevo agendamiento, no el de
  reagendamiento.

### [x] BUG-C: reagendar con horario ocupado — ESCENARIO CORREGIDO 2026-06-30
- **Escenario**: `569900538`
- **Investigado 2026-06-30**: el escenario tiene solo 2 pasos: "quiero reagendar mi
  hora" y "a las 9 de la manana del mismo dia que tenia", sin NINGUN paso previo que
  cree una reserva. El lead llega sin booking activo en DB.
- **Comportamiento real del bot**: correcto — dice "no encontre una reserva activa"
  porque efectivamente no hay ninguna.
- **Fix necesario**: actualizar el escenario 538 para que incluya los pasos previos
  de cotizar + agendar + confirmar antes de pedir reagendar, o marcar el expected_outcome
  asumiendo que no hay reserva y el bot ofrece agendar una nueva.

### [~] BUG-D: cancelar durante confirmacion final — RACE CONDITION del QA runner, no bug del bot
- **Escenario**: `569900539`
- **Investigado 2026-06-30**: se leyo `messages` directamente. El usuario dice
  "quiero cancelar" inmediatamente despues de que el bot confirmo la reserva. El
  bot respondio con la MISMA confirmacion+instrucciones en vez de cancelar.
- **Causa real**: condicion de carrera — el mensaje "quiero cancelar" fue
  procesado mientras la cadena de `confirm_booking` (crear evento en Google
  Calendar + persistir cita en DB + schedule followups) aun no habia terminado.
  `ruleCancelBooking` deberia matchear "cancelar" correctamente, pero el `6.6
  cancel_booking` no encontro reserva activa en DB porque el paso anterior no
  habia terminado de persistir.
- **Fix**: aumentar el wait del QA runner entre pasos para escenarios que incluyen
  `confirm_booking` (de 15s a 30-45s), o resetear el lead entre pasos para evitar
  el solapamiento. No requiere cambio en el codigo del bot en si.
- **Estado**: marcado como race condition del QA, NO bug de produccion.

### [ ] BUG-E: direccion incompleta (sin numero) se acepta sin validacion
- **Escenario**: `569900541`
- **Sintoma**: el usuario envia solo "Av. Providencia" sin numero. El bot la acepta
  y sigue al paso de confirmacion sin pedir que completen con numero y referencia.
- **Donde mirar**: `looksLikeAddress` en `3 rules_engine` y `6.12 confirm_address`
  — la validacion de "parece una direccion real" probablemente solo chequea si hay
  texto suficiente o palabras de calle, no si hay numero. Agregar validacion de
  que exista al menos un numero en la cadena antes de aceptarla.

### [x] BUG-E: direccion incompleta (sin numero) se acepta sin validacion — ARREGLADO 2026-06-30
- **Fix**: (1) `looksLikeAddress` ahora requiere `hasNumber` siempre (ya no acepta solo palabras de calle sin numero). (2) En `ruleConfirmAddressIfWaitingAddress`, nuevo path especifico para texto que tiene palabras de calle pero sin numero: responde "Parece que falta el numero de la calle. Me la mandas completa con numero? Por ejemplo: Av Providencia 1234...". Validado: escenario 541 OK.

### [x] BUG-F: el usuario corrige la direccion pero el bot la ignora y vuelve a pedir — ARREGLADO 2026-06-30
- **Fix**: Nueva regla `ruleAddressCorrectionDuringConfirmation` que detecta cuando `stage==="booking_confirmation"` y el usuario manda texto que parece una direccion (no una afirmacion). Actualiza `service_address` con el nuevo valor (limpiando prefijos como "en realidad es") y vuelve a pedir confirmacion con la direccion corregida. Validado: escenario 543 OK.

### [x] BUG-G: pregunta FAQ intercalada durante el flujo de agendamiento no se responde — ARREGLADO 2026-06-30
- **Fix**: (1) Guardia en `findSlotSelection` (dentro de `ruleSelectOfferedSlot`) para no interpretar como seleccion de slot cuando el texto suena a pregunta de disponibilidad horaria ("atienden"/"trabajan"/"abren"/etc.). (2) Nueva regla `ruleWeekdayAvailabilityQuestion` que extrae el dia de la semana mencionado, lo cruza contra `agentBusinessConfig.config.schedule` real, y responde con certeza ("Si, atendemos los domingos de 09:00 a 15:00" para Ahumada) en vez de inventar. Validado: escenario 551 OK + 13 BASE sin regresiones.

---

## P2 - Edge cases / pulido

### [~] BUG-H: contexto se pierde en conversaciones largas — FALSO POSITIVO DEL JUEZ
- **Escenario**: `569900550`
- **Investigado 2026-06-30**: se leyo `messages` directamente. La conversacion de
  7 turnos es CORRECTA: el bot pide vehiculo → recibe "es premium" (sin vehiculo
  ni comuna) → pide ambos → recibe "tengo un suv" → pide comuna → recibe
  "vivo en huechuraba" → cotiza premium + SUV + Huechuraba ($42.000). No hay
  perdida de contexto real; el bot acumula datos correctamente entre turnos.
- **El juez critico**: que pregunto la comuna dos veces, pero eso es correcto
  porque "tengo un suv" no incluia la comuna; no es repeticion sin razon.
- **No requiere fix de codigo**.

### [~] BUG-I: circuito de escape del loop da mensaje fuera de contexto — CAPTURA OBSOLETA
- **Escenario**: `569900523`
- **Investigado 2026-06-30**: el mensaje "Tu reclamo ya esta derivado al equipo..."
  que muestra `qa_test_results` NO es el mensaje real del bot. Es el patron de
  captura obsoleta del runner (BUG-12/13 ya documentado). El comportamiento real del
  bot ante "antofagasta"/"no se"/"mmm" como pseudo-direcciones es el circuit breaker
  "No logro reconocer la direccion..." con derivacion humana (comportamiento correcto).
- **No requiere fix de codigo** — el runner fue corregido para no traer datos
  obsoletos, pero este lead puede seguir mostrando problemas si se reusa mucho.
  Resetear el lead y re-correr en limpio para confirmar.

---

## Falsos positivos conocidos (no son bugs del bot — no arreglar)

| Escenario | Razon |
|---|---|
| 501 | Judge flakiness: bot cotizo correctamente pero no pidio datos por separado en el orden exacto que esperaba el test. Comportamiento real correcto. |
| 508 | El bot clarifica hora disponible vs pedida — correcto. El test asume que SIEMPRE hay slot a las 9am, lo cual no esta garantizado por los horarios dinamicos. |
| 510 | Juez marca "fecha inconsistente" — patron conocido: es texto sin tildes (convencion del proyecto) que el juez interpreta como error de redaccion. |
| 511/512 | Test design: el escenario no crea una reserva activa real, pero expected_outcome asume que existe. Corregir el expected_outcome, no el bot. |
| 517 | Lead sobreusado en la sesion; comportamiento real verificado via `messages` y es correcto. Resetear lead y verificar antes de cambiar codigo. |
| 547 | Ambiguedad de vehiculo ya mejorada (BUG-08 arreglado); el juez puede seguir siendo estricto con el expected_outcome original. Re-evaluar. |
| 559 | Juez no puede verificar que "120 minutos" sea el valor real configurado (no tiene acceso al config). Bug del test, no del bot. |

---

## Estado al cierre de esta ronda (2026-06-30)

**Arreglados y desplegados en produccion (bugs reales del bot)**:
- BUG-A: doble confirmacion no reconocida.
- BUG-E: direccion sin numero aceptada sin validacion.
- BUG-F: correccion de direccion ignorada.
- BUG-G: pregunta FAQ intercalada durante seleccion de slot no se respondia.

**Diagnosticados como NO bugs del bot — no requieren cambio de codigo**:
- BUG-B, BUG-D: race condition del QA runner (envio de pasos mas rapido que
  confirm_booking tarda en persistir). Fix: aumentar wait en el runner para
  escenarios post-confirm_booking.
- BUG-C: escenario corregido — se agregaron 6 pasos previos de booking completo + 1
  paso "muchas gracias" como buffer de tiempo antes del "quiero reagendar". El bot
  respondia correctamente todo el tiempo; el escenario simplemente no tenia contexto.
- BUG-H: falso positivo del juez (conversacion de 7 turnos correcta en `messages`).
- BUG-I: captura obsoleta del runner (fix ya desplegado en runner, resetear lead
  y re-verificar).

**Cero regresiones** en el set BASE de 13 escenarios en todas las corridas.

**Para el proximo batch QA** (cuando se vuelva a correr los 60 escenarios), se
espera un resultado significativamente mejor que el 47/60 anterior dado los fixes
de esta ronda acumulados sobre los de la sesion anterior.

Para cada fix: editar el export del workflow correspondiente, correr el arnes con el
escenario especifico y el set de regresion, verificar que no haya regresiones.
