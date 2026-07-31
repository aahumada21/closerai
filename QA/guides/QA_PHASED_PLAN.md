# Plan de QA por fases (n8n agent + auditoría)

Este plan estandariza cómo ejecutar QA en **fases**, priorizando primero **integridad/observabilidad** (auditoría/idempotencia/no respuesta) y luego **conversión** (cotizar/agendar) y **casos críticos** (cancelación/handoff/proveedor).

Cómo usarlo:
- Crear/usar scenarios `TEMP` en `public.qa_test_scenarios_temp` cuando estás iterando fixes.
- Guardar evidencia (los `INSERT INTO public.qa_test_results ...`) en `QA/Test/Test_*.sql`.
- Documentar fallas en `QA/GUide/FAILURES_GUIDE_Test_*.md`.
- Agregar el resumen de ejecuciones en `QA/GUide/QA_EXECUTED_SUMMARY_YYYY-MM-DD.md` (si existe) o crear uno.
- Ejemplo de formato `qa_test_scenarios_temp`: `QA/GUide/QA_TEMP_SCENARIO_EXAMPLE.md`

---

## Fase 0 — Preflight (sanidad del pipeline)

Objetivo: confirmar que el pipeline responde y **siempre audita** desde el primer turno.

Testear (mínimo):
- `Hola` (new lead) → `ask_missing_data`
- `Quiero cancelar mi reserva` (sin reserva) → `cancel_booking` + mensaje + audit
- `Quiero hablar con un humano` → `handoff_human` + audit

PASS (criterio duro):
- `qa_test_results.passed=true`
- `audit_snapshot.meta`, `audit_snapshot.decision`, `audit_snapshot.flow_name`, `audit_snapshot.idempotency_key` no nulos
- `bot_response` no vacío

Referencias:
- `QA/Test/Test_4_19-05-2026.sql`
- `QA/GUide/FAILURES_GUIDE_Test_4_19-05-2026.md`

Estado:
- `[COMPLETADO]` (QA PASS: `569900080`, `569900081`, `569900082` — 2026-05-19)

---

## Fase 1 — Inbound / Descubrimiento (inicio conversación típico)

Objetivo: enrutar bien desde saludo/consulta inicial.

Casos:
- saludo + “lavado a domicilio” → pedir datos mínimos (vehículo/comuna)
- “¿Qué servicios ofrecen?” → menú + selección
- “¿Cuánto se demoran?” → respuesta informativa + CTA

PASS:
- acción correcta (`ask_missing_data` / `send_service_menu` / `answer_question`)
- si falta info: pedir **solo lo necesario** con copy claro

Estado:
- `[COMPLETADO]` (QA PASS: `569900083`, `569900084`, `569900085` — 2026-05-19)

---

## Fase 2 — Cotización (core comercial)

Objetivo: con contexto suficiente, debe cotizar; con contexto insuficiente, pedir faltantes.

Casos:
- “SUV en Las Condes quiero cotizar” → `send_quote`
- “Quiero cotizar” (sin datos) → `ask_missing_data`
- normalizaciones: “jeep”→SUV, “nunoa”→Ñuñoa
- pricing fallback (si aplica): hatchback/sedán

PASS:
- `send_quote` incluye precio + qué incluye + siguiente paso
- `ask_missing_data` pide campos esperados

Nota (importante):
- Para validar **cotización real**, el scenario debe entregar `service_interest + vehicle_type + district` antes del step de verificación, y el último step debe exigir `allowed_last_bot_action: ["send_quote"]`.

Estado:
- `[COMPLETADO]` (QA PASS: `569900091`, `569900092`, `569900093`, `569900094`, `569900095` — 2026-05-19)

---

## Fase 3 — Booking (agendar end-to-end)

Objetivo: ofrecer horarios, seleccionar slot, pedir dirección, confirmar.

Casos (3+ pasos):
1) cotiza → “Agendar” → ofrece 3+ slots
2) usuario elige opción (1/2/3) → si falta dirección: `collect_address`
3) usuario entrega dirección → `confirm_address`
4) usuario confirma → `confirm_booking`

PASS:
- idempotencia estable (no duplica efectos)
- estado avanza correctamente (`booking_selection` → `collecting_address` → `address_confirmation` → `booking_confirmed`)
- audit completo en cada paso

Estado:
- `[COMPLETADO]` (QA PASS: `569900098`, `569900099` — 2026-05-19)

---

## Fase 4 — Post-cotización / Seguimiento (conversión y retención)

Objetivo: manejar “no decisión” y followups.

Casos:
- “Ya, después te aviso” → `schedule_followup` (no `offer_booking`)
- objeciones: “Está caro” y “Lo voy a pensar” → `answer_objection` con cierres esperados

PASS:
- contenido mínimo (cierres + ayuda + horario si aplica)
- acción consistente (sin saltos a booking si no corresponde)

---

## Fase 5 — Cancelaciones / Reagendamiento / Handoff (críticos)

Objetivo: cubrir flujos que rompen producción si fallan.

Casos:
- cancelar sin reserva (1–2 pasos) → responde + audita
- crear reserva y luego cancelar (multi-step) → audita ambas acciones
- reagendar → ofrece nuevas opciones
- handoff explícito + “urgente” posterior → mantiene lock de handoff y audita

PASS:
- `cancel_booking` outcome correcto (sin reservar vs con reserva)
- audit nunca vacío

Estado:
- `[PENDIENTE]` (bloqueado por fallo intermitente en QA handoff: `569900219`, `569900220`, `569900221` — 2026-05-22)

---

## Fase 6 — Robustez / Observabilidad (anti-regresiones)

Objetivo: detectar fallas intermitentes (primer mensaje, multi-mensajes, provider error).

Casos:
- usuario manda 2 mensajes seguidos → merge contexto correcto
- mismo mensaje duplicado → no duplica efectos (idempotencia)
- inyección `provider_error` → mensaje alternativo + audit/log

PASS:
- no hay `audit vacío`
- no hay duplicación de `outbound_message`/operaciones DB donde aplique

---

## Evidencia y cierre

Para marcar algo como “COMPLETADO”:
- debe existir al menos 1 scenario que reproduzca el bug y luego PASS posterior al fix
- los resultados (INSERTs de `qa_test_results`) deben quedar guardados en `QA/Test/Test_*.sql`
- la falla debe quedar documentada como `[CORREGIDO]` en el `FAILURES_GUIDE_Test_*.md` correspondiente
