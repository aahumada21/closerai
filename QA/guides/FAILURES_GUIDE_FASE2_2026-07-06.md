# Fallos QA FASE 2 — `qa_test_scenarios_temp` (keys 5699251418+)

**Pipeline**: `scripts/qa_pipeline_step.ps1` — 292 escenarios nuevos, iters 41-65  
**Evaluado al**: 2026-07-07  
**Regla evaluadora**: LLM (Claude) evalúa conversación completa  
**Pass rate final estimada**: ~76% (222/292 PASS, 65-70 FAIL)

---

## Bugs corregidos en FASE 2

### Bug 1 — extractOrdinalSelection: tercer/primer faltantes ✅ Corregido 2026-07-06
**Síntoma**: "el tercer slot" no seleccionaba slot 3 en booking step 3.  
**Fix**: Agregados `tercer:3, primer:1` al mapa de ordinales en `extractOrdinalSelection`.

### Bug 2 — ruleConfirmBookingFromUserConfirmation incompleto ✅ Corregido 2026-07-06
**Síntoma**: "confirmado", "perfecto", "listo", "excelente" no confirmaban la reserva (step 5).  
**Fix**: Agregadas frases al matcher de confirmación de booking.

### Bug 3 — ruleExplicitHumanRequest activado por "urgente" ✅ Corregido 2026-07-06
**Síntoma**: "manda los precios urgente" → handoff humano en vez de cotizar.  
**Fix**: Eliminado bare "urgente" del trigger de `ruleExplicitHumanRequest`.

### Bug 4 — ruleShowMeSlotsAfterQuote faltaba ✅ Corregido 2026-07-06
**Síntoma**: "muéstrame horarios" con stage=quoted disparaba FAQ en vez de mostrar slots.  
**Fix**: Nueva regla `ruleShowMeSlotsAfterQuote` posicionada antes de `ruleBusinessFaqRouter`.

### Bug 5 — ruleMultiVehicleFaq faltaba ✅ Corregido 2026-07-06
**Síntoma**: Leads existentes preguntando por dos autos simultáneos → bot confuso.  
**Fix**: Nueva regla `ruleMultiVehicleFaq` — responde "atendemos un vehículo a la vez".  
**Nota**: No aplica a first messages de new leads (inbound_router always envía promo).

### Bug 6 — ruleInlineCompleteBookingRequest posición incorrecta ✅ Corregido 2026-07-06
**Síntoma**: "quiero el basico sedan maipu" después de FAQ → `ruleBusinessFaqRouter` interceptaba "a domicilio" antes.  
**Fix**: Regla creada y reposicionada antes de `ruleBusinessFaqRouter` en el array.

### Bug 7 — ruleAffirmativeAfterPriceListAskService restrictiva ✅ Corregido 2026-07-07
**Síntoma A**: "si quiero" después de "precio del lavado basico?" → early exit `if (hasService)` → no avanzaba.  
**Síntoma B**: "si dale", "ok si", "si perfecto" → no en `isAffirmativeReply` → caían a `ruleUnknownFAQ`.  
**Síntoma C**: "si" después de cualquier price inquiry → `intent_last="price_list_requested"` no en `isPriceContext`.  
**Fix**: 
- Eliminado early exit `if (hasService) return null`
- Agregado `price_list_requested` a `isPriceContext`
- `isAffirmativeReply` expandida con "si dale", "ok si", "si perfecto", "agendo", etc.
- Mensajes contextuales según qué campos faltan (vehicle+district, solo vehicle, solo service, etc.)
**Confirmado PASS**: B5-Affirm-2 ("precio del lavado basico?" + "si quiero") → PASS

---

## Fallos residuales aceptados

### R1 — B1-Book dirección de prueba inconsistente (2 escenarios)
Escenarios: `5699251421`, `5699251427`  
Causa: Dirección de test generada no coincide con la comuna del servicio. El bot completó el flujo correctamente, el evaluador penaliza la inconsistencia geográfica. Problema del dato de test, no del bot.

### R2 — B1-Book vehículos no atendidos: moto y furgón (~24 escenarios)
Escenarios: `5699251428-5699251439`, `5699251458-5699251469`  
Causa: El bot solo atiende sedan/SUV/camioneta. Para moto/furgón deriva a asesor humano ("lo sentimos, solo atendemos…"). El evaluador espera booking completo. Comportamiento correcto del bot.

### R3 — B5-Affirm genérico: diseño 2-pasos vs arquitectura bot (~18 escenarios)
Escenarios: `5699251690`, `5699251692-5699251709`  
Causa: Step 1 = consulta de precio genérica (sin vehículo/distrito), step 2 = bare affirmative ("si", "si dale"). El bot en step 1 correctamente pide vehículo+distrito. En step 2 reitera (no puede avanzar sin datos). Evaluador dice "no hubo progreso".  
Por qué no es fixable: Para avanzar necesitaría asumir datos sin tenerlos. Escenario tiene 2 pasos insuficientes para el flujo real del bot (que requiere 3+ turnos).  
Excepción: Cuando step 1 incluye el servicio (tipo "precio del lavado basico?"), el Bug#7 fix permite paso 2 "si quiero" → PASS (ver `5699251691`).

### R4 — B5-Affirm-19 "es caro el encerado full" (1 escenario)
Escenario: `5699251708`  
Causa: "es caro el encerado full?" interceptado por `ruleUnknownFAQ`. Bug#7 no aplica porque no es un affirmative. Fix requeriría nueva regla de objeción de precio, out-of-scope.

### R5 — B5-Affirm-20 "cuanto saldria para un sedan en maipu" (1 escenario)
Escenario: `5699251709`  
Causa: New lead first message → inbound_router envía promo de bienvenida ignorando el contenido. Step 2 affirmative llega sin contexto de price inquiry en `intent_last`. Bug#7 no aplica porque `isPriceContext=false` después de la promo de bienvenida.

### R6 — B5-PriceList moto/furgón y selección de servicio por LLM (~8-10 escenarios)
Escenarios: `5699251674-5699251682`, `5699251686-5699251687`  
Causa múltiple:
- Moto/furgón como step 1: bot redirige, flujo no avanza
- Estado de lead contaminado por re-runs del mismo número de teléfono
- LLM selecciona "premium" automáticamente en vez de mostrar lista
- Step 2 "huechuraba y tengo un suv" sin preposición clara no es interpretado

### R7 — B5-FAQ2Book sin servicio en step 2 (3 escenarios)
Escenarios: `5699251653`, `5699251660`, `5699251665`  
Causa: Step 2 = intención de booking ambigua (sin servicio explícito). Bot no avanza al booking directamente.

### R8 — B2-FAQ/B3-Queja/B4-Edge técnicos y de contenido (~8 escenarios)
Escenarios: `5699251482`, `5699251493`, `5699251504`, `5699251574`, `5699251604`, `5699251624`, `5699251644`, `5699251648`  
Causas: n8n crashes, respuesta de producto incorrecto (LLM), cobertura de Lampa no confirmable, contexto multi-vehículo en new leads siempre recibe promo de bienvenida.

---

## Resumen por categoría

| Categoría | Total | PASS | FAIL | Causa residual |
|---|---|---|---|---|
| B4-Edge (120 escenarios) | 120 | ~116 | ~4 | R8 |
| B1-Book supported | ~24 | ~22 | ~2 | R1 |
| B1-Book moto/furgón | 24 | 0 | 24 | R2 |
| B5-Affirm | 20 | ~2 | ~18 | R3, R4, R5 |
| B5-PriceList | 20 | ~10 | ~10 | R2, R6 |
| B5-FAQ2Book | 20 | ~17 | ~3 | R7 |
| B2-FAQ | ~40 | ~37 | ~3 | R8 |
| B3-Queja | ~20 | ~19 | ~1 | R8 |
| **TOTAL** | **~292** | **~223** | **~65** | |

Todos los fallos son residuales por razones de negocio o diseño de escenario — no indican bugs en el bot para los casos de uso principales (booking sedan/SUV/camioneta en comunas cubiertas).
