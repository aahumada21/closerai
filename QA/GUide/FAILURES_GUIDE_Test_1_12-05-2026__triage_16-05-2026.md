# Problemas QA (priorizados) — `QA/Test/Test_1_12-05-2026.md`

Fuente de datos:
- Resultados crudos: `QA/Test/Test_1_12-05-2026.md` (JSON)

Resumen:
- Fallas detectadas: **7**
- Enfoque: dónde ocurre, hipótesis y por dónde empezar a corregir.

---

## 1) No hay respuesta / auditoría vacía (crítico)
Escenarios:
- `cancelar_sin_reserva` (step 1)
- `cancelar_reserva_conversacion_nueva` (step 1)
- `selecciona_horario_opcion_2` (step 4)

Síntomas en QA:
- `bot_response` nulo o vacío.
- `audit_snapshot` vacío (no hay `flow_name`, `decision`, `idempotency_key`).
- `last_bot_action` nulo.

Dónde mirar (probable):
- Workflow principal `action_executor` y/o su “entrada” (router/IF) antes de persistir/auditar.
- Subworkflow de cancelación: `workflows/exports/uncategorized/6.6 - 6.6 cancel_booking__id-HG7Wzxf3eRUQ8Cck.json`
- Persist/audit (si se está cortando antes de escribir auditoría): `workflows/exports/uncategorized/6.24 - 6.24 persist_and_audit__id-5kcYOeYHLlcAFtf9.json`

Hipótesis más común:
- Rama del router devuelve `[]`/null o se queda sin items por un `Code` mal formado, y por eso no corre persistencia/auditoría.
- La rama de “cancelar sin reserva” no hace fallback consistente (`answer_question` / `handoff_human`) y termina sin output.

Cómo depurar rápido:
1) En n8n, ejecutar el caso y revisar en qué nodo se queda sin items.
2) Confirmar que **siempre** exista un “camino feliz” hacia `persist_and_audit` (aunque sea con fallback).

Estado (según repo):
- `[SIN TEST]` fix aplicado en `6.6 cancel_booking` para devolver items válidos en ambas ramas (con/sin reserva).

---

## 2) Pricing no encontrado (impacto alto en conversión)
Escenario:
- `cotizacion_basico_hatchback` (step 3)

Síntomas en QA:
- Respuesta no incluye precio/valor.
- Auditoría menciona `pricing_rule_not_found`.

Dónde mirar (probable):
- Resolver pricing: `workflows/exports/uncategorized/6.0 - 6.0 resolve_pricing_from_db__id-IY7i8Sd3LFcjGHe4.json`
- Envío de cotización: `workflows/exports/uncategorized/6.8 - 6.8 send_quote__id-HFDEtN5WN2oMU7E2.json`

Hipótesis:
- Falta regla en DB (service + vehicle_type + district), o el mapeo de `vehicle_type`/`district` no coincide con las keys esperadas.

Fix recomendado:
- Agregar regla faltante en tabla de pricing (o normalizar keys antes del lookup).
- Definir fallback: si no hay pricing, responder con “te confirmo el valor” y escalar a humano o followup (sin quedar mudo).

---

## 3) Clasificación incorrecta: “después te aviso” => agenda
Escenario:
- `cliente_desaparece_despues_cotizacion` (step 4)

Síntoma en QA:
- `last_bot_action` esperado: `schedule_followup` (o `answer_question`/`answer_objection`)
- recibido: `offer_booking`

Dónde mirar (probable):
- Reglas determinísticas: `rules_engine` (export según inventario de workflows en `workflows/catalog/workflows.inventory.json`).
- Prompt de decisión (si depende del LLM): `workflows/exports/uncategorized/5 - 5 llm_decision__id-Li3qmQHIKbjqWY15.json`

Hipótesis:
- Intent post-cotización se interpreta como invitación a agendar en vez de “seguimiento”.

Estado (según repo):
- `[SIN TEST]` regla determinística agregada en `rules_engine` para disparar `schedule_followup` ante “después te aviso / lo veo / lo voy a pensar…”.

---

## 4) Objeción “lo voy a pensar” con copy débil (calidad)
Escenario:
- `objecion_lo_pensare` (step 4)

Síntoma en QA:
- Respuesta no incluye cierres esperados: “perfecto”, “cualquier cosa”, “te puedo ayudar”, “horario”.

Dónde mirar (probable):
- Copy/plantilla en action: `answer_objection` dentro de `action_executor` (y/o reglas de `rules_engine`).

Estado (según repo):
- `[SIN TEST]` copy mejorado (cierre + oferta de ayuda + CTA suave) en `action_executor` / alternativa por `rules_engine`.

---

## 5) No recomienda “premium” ante “auto muy sucio” (oportunidad comercial)
Escenario:
- `auto_muy_sucio_recomienda_premium` (step 1)

Síntoma en QA:
- No menciona “premium”/“lavado premium”/“detallada”.
- Acción tomada: `ask_missing_data` (en vez de recomendar/encaminar a premium).

Dónde mirar (probable):
- Prompt/heurísticas de decisión: `workflows/exports/uncategorized/5 - 5 llm_decision__id-Li3qmQHIKbjqWY15.json`
- Reglas determinísticas antes del LLM: `rules_engine`

Hipótesis:
- El LLM está priorizando “falta info” antes que “recomendar servicio” cuando hay señales fuertes.

Fix recomendado:
- Agregar regla determinística: si texto contiene “muy sucio por dentro y por fuera / lavado profundo”, setear `service_interest=lavado_premium` y luego pedir **1** dato faltante.
- O reforzar el prompt para mapear “lavado profundo”/“muy sucio” => premium (ya existe mención de “lavado profundo”; falta cubrir “muy sucio”).

---

## 6) Auditoría vacía en selección de horario (integridad)
Escenario:
- `selecciona_horario_opcion_2` (step 4)

Síntoma en QA:
- `audit vacío: no hay flow_name, decision ni idempotency_key`

Dónde mirar (probable):
- El subworkflow que ejecuta la acción de disponibilidad/confirmación y luego persiste: `persist_and_audit`.
- El armado de `idempotency_key`/audit payload en la rama de booking dentro de `action_executor`.

Fix recomendado:
- Garantizar que cada turno setee `idempotency_key` + `audit_logs` incluso si no hay side-effects.

---

## 7) (Nueva clase de falla observada en 2026-05-16) `persist_and_audit` sin `lead_id`
Síntoma:
- Error en n8n: `Missing lead_id for outbound message`

Dónde mirar:
- `workflows/exports/uncategorized/6.24 - 6.24 persist_and_audit__id-5kcYOeYHLlcAFtf9.json` (nodo `build_outbound_message_payload`)

Hipótesis:
- El workflow que llama `6.24` está pasando `{ payload: "..." }` sin `lead_id` (o `payload` string sin JSON parseado).

Estado (según repo):
- `[SIN TEST]` `6.24` ahora soporta `payload` como string JSON u objeto (lo parsea/mergea antes de buscar `lead_id`).

---

## Orden recomendado de arreglo (de más importante a menos)
1) No respuesta / auditoría vacía (rompe QA y observabilidad).
2) Pricing rule not found (impacta conversión y confianza).
3) Persist/audit sin `lead_id` (rompe efectos y DB).
4) Intent “después te aviso” => followup.
5) Copy de objeciones (“lo voy a pensar”).
6) Recomendación premium ante señales (“muy sucio”).

