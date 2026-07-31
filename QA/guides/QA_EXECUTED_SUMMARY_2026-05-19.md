# QA ejecutados (resumen)

Este archivo registra los **QA ya ejecutados** durante el cierre de los hallazgos del ciclo `Test_1_12-05-2026`.

Fuente principal:
- Guía/triage: `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`

---

## QA realizados (scenarios)

| Fecha (TZ America/Santiago) | Scenario ID | Nombre | Resultado | Cubre |
|---|---:|---|---|---|
| 2026-05-16 | 569900006 | TEMP QA006: crear reserva y luego cancelar (misma conversación) | PASS | #1 (auditoría completa end-to-end) |
| 2026-05-16 | 569900020 | TEMP QA020: cotizacion_basico_hatchback debe retornar precio (fallback hatchback->sedan) | PASS | #2 (pricing fallback) |
| 2026-05-16 | 569900025 | TEMP QA025: despues te aviso post-cotizacion => schedule_followup (no offer_booking) | PASS | #3 (followup determinístico) |
| 2026-05-18 | 569900027 | TEMP QA027: objecion \"lo voy a pensar\" => answer_objection con cierre + ayuda + horarios | PASS | #4 (copy objeción) |
| 2026-05-18 | 569900028 | TEMP QA028: auto muy sucio => recomienda premium y pide 1 dato | PASS | #5 (recomendación premium) |
| 2026-05-18 | 569900029 | TEMP QA029: selecciona_horario_opcion_2 => nunca audit vacio | PASS | #6 (audit en selección de horario) |
| 2026-05-19 | 569900030 | TEMP QA030: persist_and_audit acepta payload string con lead_id | PASS | #7 (persist_and_audit payload/lead_id) |
| 2026-05-19 | 569900033 | TEMP QA031: cancelar_sin_reserva => responde + audita | PASS | #1 (audit no vacío en 1er turno) |
| 2026-05-19 | 569900060 | TEMP QA060: hola + cancelar => audit nunca vacio | PASS | #1 (audit no vacío en 1er turno) |
| 2026-05-19 | 569900061 | TEMP QA061: pedir humano + urgente => audit nunca vacio | PASS | #1 (audit no vacío en 1er turno) |
| 2026-05-19 | 569900062 | TEMP QA062: hola + auto muy sucio => audit nunca vacio | PASS | #1 (audit no vacío en 1er turno) |
| 2026-05-19 | 569900083 | TEMP QA083: inbound saludo + lavado a domicilio => pide datos mínimos | PASS | Fase 1 (inbound) |
| 2026-05-19 | 569900084 | TEMP QA084: inbound menu servicios => muestra menu y permite selección | PASS | Fase 1 (inbound) |
| 2026-05-19 | 569900085 | TEMP QA085: inbound FAQ ¿cuánto se demoran? => responde + CTA | PASS | Fase 1 (inbound) |
| 2026-05-19 | 569900091 | TEMP QA091: cotiza SUV Las Condes (completo) => send_quote | PASS | Fase 2 (cotización) |
| 2026-05-19 | 569900092 | TEMP QA092: cotizar sin datos => ask_missing_data | PASS | Fase 2 (cotización) |
| 2026-05-19 | 569900093 | TEMP QA093: normaliza jeep=>SUV y cotiza => send_quote | PASS | Fase 2 (cotización) |
| 2026-05-19 | 569900094 | TEMP QA094: normaliza nunoa=>Ñuñoa y cotiza => send_quote | PASS | Fase 2 (cotización) |
| 2026-05-19 | 569900095 | TEMP QA095: pricing fallback hatchback/sedan (completo) => send_quote | PASS | Fase 2 (cotización) |
| 2026-05-19 | 569900098 | TEMP QA098: booking end-to-end premium SUV Las Condes => offer_slots/collect_address/confirm_address/confirm_booking | PASS | Fase 3 (booking e2e) |
| 2026-05-19 | 569900099 | TEMP QA099: booking elige opción 2 => collect_address (audit nunca vacío) | PASS | Fase 3 (booking e2e) |

Notas:
- Si necesitas “evidencia cruda” (INSERTs de `qa_test_results`), normalmente se guardan como SQL exportado desde QA runner (ej: `qa_test_results_rows*.sql`).

---

## Puntos abordados (solo títulos + referencias)

- **#1 No hay respuesta / auditoría vacía (crítico)** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#2 Pricing no encontrado (impacto alto en conversión)** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#3 Clasificación incorrecta: “después te aviso” => agenda** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#4 Objeción “lo voy a pensar” con copy débil (calidad)** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#5 No recomienda “premium” ante “auto muy sucio” (oportunidad comercial)** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#6 Auditoría vacía en selección de horario (integridad)** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **#7 persist_and_audit sin lead_id** — `QA/GUide/FAILURES_GUIDE_Test_1_12-05-2026__triage_16-05-2026.md`
- **Plan de QA por fases** — `QA/GUide/QA_PHASED_PLAN.md`
