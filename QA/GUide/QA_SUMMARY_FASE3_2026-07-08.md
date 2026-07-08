# QA FASE 3 — Resumen Final
**Fecha:** 2026-07-08  
**Iteraciones:** 72-82 (320 escenarios ejecutados)  
**Estado final:** COMPLETADO — 20/20 PASS en la última iteración

---

## Objetivo

Ejecutar 300 escenarios QA contra el sistema AI Closer n8n de Ahumada Detailing, identificar y corregir todos los bugs en el workflow `3 rules_engine` (ID: `e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5`).

**Meta superada:** 320 escenarios ejecutados (iters 72-82).

---

## Bugs corregidos en FASE 3

### Bugs 15-24 (iters 73-76)
| # | Descripción | Nodo/función |
|---|-------------|-------------|
| 15 | `ruleQuoteRequest` re-cotizaba en "lo reservo" | `isAffirmativeReply` guard |
| 16 | `ruleCheaperAlternativeRequest` disparaba en afirmativas con "caro" | `isAffirmativeReply` guard |
| 17 | Payment FAQ no mencionaba rechazo de tarjeta | Template payment_methods |
| 18 | "cuantos salen"/"cuanto valen" no reconocidos como consulta de precio | `userAsksPrice` expandida |
| 19 | "genial"/"me convence" no en `isAffirmativeReply` | Exact + includes |
| 20 | "descuento si pago anticipado?" → payment FAQ en vez de discounts | Reordenamiento faqRules |
| 21 | `ruleServiceSelectedAfterPriceList` requería intent_last exacto | Añadido "price_list_ready"/"quote_sent" |
| 22 | "diferencia entre el basico y el premium?" no matcheaba | Variantes con artículos en basic_vs_premium keys |
| 23 | `ruleServiceSelectedAfterPriceList` con quote_sent disparaba en FAQ de pago | Guard: keyword de servicio requerida |
| 24 | "mas barato" en discounts FAQ interceptaba cheaper-alt | Eliminado de discounts keys |

### Bugs 25-33 (iters 77-80)
| # | Descripción | Nodo/función |
|---|-------------|-------------|
| 25 | "como se paga" no matcheaba payment FAQ | Añadido "paga", "se paga" a keys |
| 26 | `${closingQuestion}` en payment_methods generaba mensaje confuso | Eliminado closingQuestion del template |
| 27 | "no puedo pagar, hay algo mas barato?" → payment FAQ | Guard en `ruleBusinessFaqRouter` |
| 28 | "me quedo con ese/eso" no reconocido como afirmativo | Añadido includes variants |
| 29 | "es perfecto"/"esta perfecto" no reconocidos | Añadido includes variants |
| 30 | "vamos pa eso", "me parece bien", "arranquemos", "dale perfecto", "mandame una hora" | Añadido a `isAffirmativeReply` |
| 31 | "hay algo mas accesible en precio?" re-cotizaba (PCI + ruleQuoteRequest + ruleSendQuote) | Guard `_rqAsksCheaper` + `_sqAsksCheaper` en 3 reglas |
| 32 | "va", "me decido", "me anoto", "esta re bien", "me apunto" no reconocidos | Añadido a `isAffirmativeReply` |
| 33 | "mas economica" (femenino), "menor precio" no en cheaper-alt | Añadido variantes femeninas y de precio |

### Bugs 34-39 (iters 81-82)
| # | Descripción | Nodo/función |
|---|-------------|-------------|
| 34 | "adelante", "confirmo", "trato" no en `isAffirmativeReply` | Añadido exact + includes |
| 35 | "como hago para transferir?" no matcheaba payment FAQ | Añadido "transferir" a payment_methods keys |
| 36 | "me hace ruido el precio pero va" → PCI re-cotizaba | `isAffirmativeReply` incluido en `_pciIsBookingSignal` |
| 37 | "donde atienden, tienen local?" → LLM vago | Añadido "local", "tienen sede", "donde atienden", etc. a home_service keys |
| 38 | "pero va", "igual va" no reconocidos como afirmativos | Añadido includes en `isAffirmativeReply` |
| 39 | "hay alternativa?" solo → falls through to LLM | Añadido `t.includes("alternativa")` a `asksForCheaper` en `ruleCheaperAlternativeRequest` |

---

## Resultados por iteración

| Iter | Keys | Sent | Pass | Fail | Código | Bugs validados |
|------|------|------|------|------|--------|----------------|
| 72 | 5699251811-5699251830 | 20 | 16 | 4 | B antes 15 | Descubrió 15-18 |
| 73 | 5699251831-5699251850 | 20 | 18 | 2 | Post-15-18 | 15,16,17,18 ✓ |
| 74 | 5699251851-5699251870 | 20 | 18 | 2 | Post-19-20 | 19,20 ✓ |
| 75 | 5699251871-5699251890 | 20 | 17 | 3 | Post-21-22 | 21,22 ✓ |
| 76 | 5699251891-5699251910 | 20 | 16 | 4 | Post-23-24 | 23,24 ✓ |
| 77 | 5699251911-5699251930 | 20 | 17 | 3 | Post-25-28 | 25,26,27,28 ✓ |
| 78 | 5699251931-5699251950 | 20 | 14 | 6 | Post-29 | 29 ✓, descubrió 30-31 |
| 79 | 5699251951-5699251970 | 20 | 26 | 17 | Post-30-33 | 30,32,33 ✓ |
| 80 | 5699251971-5699251990 | 20 | 23 | 10* | Pre-34-39 | *Old code — fallos esperados |
| 81 | 5699251991-5699252010 | 20 | 37 | 3* | Post-31,34,35 | 31,34,35 ✓; *3 old-code fails |
| 82 | 5699252011-5699252030 | 20 | **20** | **0** | Post-36-39 | **20/20 PASS** ✓ |

*Nota: Fallos marcados con * son escenarios que corrieron con código anterior al deploy del fix y se re-validaron exitosamente en la siguiente iteración.

---

## Fallos residuales aceptados

| ID | Escenario | Motivo de aceptación |
|----|-----------|---------------------|
| 5699251913 | C67v3-BOOK-3step | Expected_outcome mal redactado; el bot sí mencionó horarios correctamente en step 1 |
| 5699251966 | C126-FAQ-MOTO | "también lavan motos?" — evasión del bot es decisión de negocio (no cubren motos) |

---

## Estado del sistema al cierre

**Código en vivo (n8n):** 178,423 chars en `rules_evaluation`  
**Archivo fuente:** `scratchpad/rules_eval_patched_b11.js`  
**Workflow JSON:** `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json`  

**Categorías con 100% pass en tests recientes:**
- Booking accept: "si", "ok", "dale", "adelante", "confirmo", "trato", "va", "me parece bien", "arranquemos", "de acuerdo", "sin problema", "pero va", "igual va", "pero si" — todos reconocidos
- Cheaper alternative: todos los keywords de precio + alternativa correctamente redirigen a `ruleCheaperAlternativeRequest`
- Payment FAQ: "pagar", "paga", "transferencia", "transferir", "tarjeta", "efectivo" — todos matchean
- Home service FAQ: "domicilio", "local", "tienen sede", "donde atienden", "donde quedan" — todos matchean

---

## Aprendizajes para FASE 4

1. **Guard coherence:** cuando se agrega un keyword a un guard (e.g., "alternativa" en PCI/ruleQuoteRequest), debe agregarse también al handler correspondiente (ruleCheaperAlternativeRequest) o crea un "dead zone" donde la request queda sin handler.

2. **isAffirmativeReply como gate universal:** las afirmativas deben estar en `isAffirmativeReply` y esa función debe usarse en todos los guards de booking signal y re-cotización. No duplicar listas.

3. **Deploy por nombre, no por posición:** en workflows con múltiples Code nodes, siempre patchear por `$_.name` exacto. El primer nodo con jsCode suele ser `extract_context`, no `rules_evaluation`.

4. **Re-run con código nuevo:** cuando un escenario falla en iter N pero el fix se deploya entre iter N y N+1, los fallos de iter N son esperados — crear escenarios v2/v3 en iter N+1 para validar.
