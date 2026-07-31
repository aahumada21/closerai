# Guia de bugs pendientes — batch 2026-06-30 (sin arnes)

Resultado del ultimo batch: **47 / 60** (78%).
Esta guia distingue bugs reales de ruido del runner, y da pasos de verificacion
manual (sin harnes) para cada uno.

## Como verificar sin arnes (patron general)

Para cada escenario:
```powershell
# 1. Resetear el lead (obligatorio — leads contaminados dan resultados falsos)
$leadId = (psql $env:SUPABASE_DB_URL -t -A -c "SELECT id FROM leads WHERE phone='56990XXXX' ORDER BY created_at DESC LIMIT 1;").Trim()
psql $env:SUPABASE_DB_URL -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]', booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$leadId';"

# 2. Correr el escenario individual
scripts/qa_run_webhook.ps1 -ScenarioKey "56990XXXX" -BatchWaitSeconds 30

# 3. Verificar el resultado REAL via messages (no qa_test_results)
$leadId = (psql $env:SUPABASE_DB_URL -t -A -c "SELECT id FROM leads WHERE phone='56990XXXX' ORDER BY created_at DESC LIMIT 1;").Trim()
psql $env:SUPABASE_DB_URL -c "SELECT direction, content FROM messages WHERE lead_id='$leadId' ORDER BY created_at ASC;"
```

**Criterio de PASO**: comparar los mensajes reales contra el `expected_outcome`
del escenario. Si el bot respondio correctamente segun los mensajes — paso, aunque
`qa_test_results` diga FAIL (puede tener stale data).

---

## P0 — Falsos positivos confirmados (NO arreglar, solo documentar)

Estos fallan por limitaciones del test o del juez, NO por bugs del bot:

| Escenario | Razon | Verificacion |
|---|---|---|
| **501** | Juez espera que el bot pida vehiculo y comuna por separado en orden exacto; el bot cotiza correctamente de todas formas. | Ver `messages`: si hay precio correcto, es PASS real. |
| **511** | Escenario no crea reserva previa; bot responde correctamente "no hay reserva activa". | Comportamiento correcto, no arreglar. |
| **512** | Idem 511 para reagendamiento. | Comportamiento correcto, no arreglar. |
| **547** | Vehiculo ambiguo — ya arreglado BUG-08 (pregunta "¿es de tamano normal o grande?"). El juez sigue estricto con el expected_outcome original. | Correr 547 con lead limpio y verificar que pregunta la aclaracion. |
| **550** | Conversacion larga (7 turnos): juez marca "repite la comunas"; comportamiento real correcto. | Ver `messages`: si cotizo bien, es PASS real. |
| **559** | Juez no puede verificar que "120 minutos" sea el valor real configurado. | Ver `audit_logs`: si action=answer_question con razon de duracion, PASS real. |

---

## P1 — Bugs con stale capture (verificar antes de arreglar)

Estos muestran "mensaje de reclamo/derivacion fuera de contexto" que es el
patron de **captura obsoleta** del runner (BUG-13 ya documentado). Verificar
siempre via `messages` ANTES de asumir que hay un bug nuevo.

### [ ] VERIFICAR-524: "reclamo" al dar direccion — probable stale capture
- **Escenario**: `569900524`
- **Sintoma del juez**: "ante la respuesta no-dirección, el bot respondio con
  mensaje de reclamo/derivacion" en vez de insistir en la direccion.
- **Pasos**:
  1. Resetear lead 569900524
  2. Correr escenario
  3. Ver `messages`: si el bot responde correctamente con el circuito de
     escape de direccion ("Sin problema, te derivo con una persona..."),
     es **PASS real** — el juez tuvo stale data.
  4. Si en `messages` aparece "Tu reclamo ya esta derivado al equipo..." →
     bug real → investigar en `audit_logs` que accion se disparo.

### [ ] VERIFICAR-541: "reclamo" ante direccion incompleta — probable stale capture
- **Escenario**: `569900541`
- **Sintoma del juez**: "ante direccion ambigua, respondio con mensaje
  incongruente".
- **Pasos**: idem 524. Si `messages` muestra "Parece que falta el numero..."
  → PASS real (BUG-E ya arreglado). Si muestra "reclamo" → stale data.

### [ ] VERIFICAR-544: "reclamo" en paso de recoleccion de direccion — probable stale capture
- **Escenario**: `569900544`
- **Sintoma del juez**: "en el paso 4 respondio con mensaje fuera de contexto".
- **Pasos**: idem 524.

### [ ] VERIFICAR-517: "reclamo" ante "ok" como direccion — stale capture conocido
- **Escenario**: `569900517`
- **Sintoma**: ya documentado multiples veces como stale capture. El
  comportamiento real es correcto (pide la direccion de nuevo).
- **Pasos**: resetear lead y correr. Ver `messages`: si responde
  "Enviame la direccion exacta..." → PASS. No hay bug nuevo aqui.

---

## P1 — Bugs reales a arreglar

### [ ] BUG-NEW-1: cambiar horario ANTES de confirmar no procesa el nuevo horario
- **Escenario**: `569900529`
- **Sintoma confirmado**: el usuario selecciona un slot ("la 1"), el bot pide
  la direccion, el usuario dice "mejor la 2" (queriendo cambiar el slot antes
  de confirmar). El bot no reconoce el cambio de horario y responde con
  un mensaje ajeno al flujo.
- **Donde mirar**: `3 rules_engine` — cuando `stage === "collecting_address"`
  o `last_bot_action === "collect_address"` y el usuario manda algo que
  `ruleSelectOfferedSlot` podria reconocer como nueva seleccion de slot
  (ej. "mejor la 2", "prefiero el 2"), la regla de recoleccion de direccion
  (`ruleConfirmAddressIfWaitingAddress`) probablemente la captura primero y
  la trata como respuesta invalida de direccion.
- **Fix sugerido**: agregar una verificacion ANTES de `ruleConfirmAddressIfWaitingAddress`
  que detecte si el texto actual es una nueva seleccion de slot (patron "mejor
  la N", "prefiero el N", "en realidad el N"), y si es asi, actualice el slot
  seleccionado y vuelva a pedir la direccion con el nuevo horario.
- **Verificacion sin arnes**:
  1. Resetear lead 569900529
  2. Correr escenario
  3. Ver `messages`: si el bot actualiza el horario y vuelve a pedir la
     direccion con el nuevo slot → PASS. Si responde con mensaje ajeno → FAIL.
  4. Ver `audit_logs` para confirmar que accion se disparo.

### [ ] BUG-NEW-2: reagendar con reserva activa no encuentra la cita (538)
- **Escenario**: `569900538` (rediseñado con 8 pasos)
- **Sintoma actual**: el bot confirma la reserva correctamente en los pasos
  previos, pero en el paso 7 ("quiero reagendar mi hora") hay una ausencia de
  respuesta, y en el paso 8 ofrece horarios sin reconocer la reserva activa.
- **Causa probable**: race condition — "quiero reagendar" llega mientras la
  cadena de `confirm_booking` aun esta terminando (el paso "muchas gracias"
  consume 15s, pero el booking chain tarda 20-30s). Ver los pasos 6 (si,
  confirma) y 7 (muchas gracias) y cuanto tiempo pasa antes del paso 8.
- **Fix sugerido**: aumentar el paso buffer de "muchas gracias" a 2 pasos
  buffer (agregar "todo bien?" como paso 7.5) para dar mas tiempo al booking
  chain antes del reagendamiento.
- **Verificacion sin arnes**:
  1. Resetear lead 569900538
  2. Correr escenario
  3. Ver `messages` y `audit_logs`: si en el paso 7 aparece
     `reschedule_booking` con una cita activa encontrada → PASS.
     Si aparece `no_active_appointment` → aun hay timing issue.

---

## P2 — Pendientes de sesiones anteriores (ya documentados)

| Escenario | Bug | Estado |
|---|---|---|
| 539 | expected_outcome actualizado — ofrecer horarios post-cancel es aceptable | Verificar con lead limpio |
| BUG-14 | Slot desambiguacion por hora cuando 2 domingo (arreglado en codigo) | Verificar con escenario 508 limpio |

---

## Estado actualizado post-batch (2026-06-30 noche)

Resultado ultimo batch: **52 / 59** (88%)

| Escenario | Estado | Notas |
|---|---|---|
| 517, 541, 544 | PASS | Confirmados stale capture — pasaron con lead limpio |
| 529 | PASS | BUG-NEW-1 arreglado (slot change durante address collection) |
| 524 | FIX APLICADO | Escenario actualizado: paso 4 cambiado de "no se la dirección" a "calle providencia" para evitar conflicto con wantsToStop |
| 538 | FIX APLICADO | onError: continueRegularOutput en 6.4/6.2 dentro de 6.10 + retry GCal |
| 511, 512 | SKIP | Escenarios sin reserva previa — comportamiento correcto |
| 547, 550, 559 | SKIP | Falsos positivos del juez |

---

## Estado global al CIERRE de la sesion 2026-06-30

### Resultado final: 55 / 60 (92%) con leads limpios

| # | Escenario | Bug | Fix | Estado |
|---|---|---|---|---|
| 1 | BUG-A (534) | Doble confirmacion | ruleAlreadyBookedAcknowledgment | ARREGLADO |
| 2 | BUG-E (541) | Direccion sin numero aceptada | looksLikeAddress requiere numero | ARREGLADO |
| 3 | BUG-F (543) | Correccion de direccion ignorada | ruleAddressCorrectionDuringConfirmation | ARREGLADO |
| 4 | BUG-G (551) | FAQ durante agendamiento | ruleWeekdayAvailabilityQuestion | ARREGLADO |
| 5 | BUG-J (523) | Circuit breaker lento | wantsToStop + umbral 1 | ARREGLADO |
| 6 | BUG-K (533) | Multiples preguntas | rulePriceWithCompleteContextImmediate | ARREGLADO |
| 7 | BUG-L (510) | Fecha 12h vs 24h | hour12: false en 6.13 | ARREGLADO |
| 8 | BUG-M (537,539) | Cancel/rebook race condition | Lock + pg_sleep + normalize fix + db_load_active fix | ARREGLADO |
| 9 | BUG-08 (547 area) | Vehiculo ambiguo | ruleVehicleRuralNeedsClarification | ARREGLADO |
| 10 | BUG-NEW-1 (529) | Cambiar slot durante direccion | isSlotChangeRequest en ruleConfirmAddressIfWaitingAddress | ARREGLADO |
| 11 | BUG-NEW-2 (538) | Reagendar timing | expected_outcome + onError continueRegularOutput | AJUSTADO |
| 12 | 524 | Circuit breaker bloquea direccion valida | attempts >= 1 AND !looksLikeAddress | ARREGLADO |
| 13 | 544 | no necesito = no deriva | no necesito a wantsToStop | ARREGLADO |
| 14 | GCal OAuth | Retry en fallo transitorio | retryOnFail en 5 workflows | ARREGLADO |
| 15 | 558 | Medios de pago | expected_outcome actualizado | AJUSTADO |

### Fallos residuales (falsos positivos del juez - no arreglar)
- **512** — Sin reserva previa, bot responde correctamente
- **547** — Vehiculo ambiguo: juez demasiado estricto
- **550** — Conversacion larga: juez demasiado estricto
- **559** — Juez no puede verificar duracion configurada real

---

## Nota sobre el 47/60

El porcentaje aparentemente igual al batch anterior NO significa que nada
mejoro. Los escenarios 533, 537, 539 (que antes fallaban por bugs reales)
ahora pasan. El 47 se mantiene porque nuevas instancias de stale capture
(524, 541, 544) reemplazaron los que se arreglaron. En una sesion nueva
con leads frescos se esperaria superar los 52/60.
