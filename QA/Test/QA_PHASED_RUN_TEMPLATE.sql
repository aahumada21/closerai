-- QA por fases (template)
-- Fecha: completar (TZ America/Santiago)
--
-- Uso:
-- 1) Copia este archivo como `QA/Test/Test_<N>_<DD-MM-YYYY>.sql`
-- 2) Pega aquí los INSERTs generados por tu QA runner:
--    INSERT INTO public.qa_test_results (...)
-- 3) Si agregas scenarios nuevos, inserta también en `public.qa_test_scenarios_temp`.
-- 4) Actualiza el failures guide del día en `QA/GUide/FAILURES_GUIDE_Test_<N>_<DD-MM-YYYY>.md`.

-- ============================================================
-- Fase 0 — Preflight (auditoría nunca vacía)
-- ============================================================
-- Casos sugeridos:
-- - Hola (new lead) => ask_missing_data
-- - Quiero cancelar mi reserva (sin reserva) => cancel_booking + audit
-- - Quiero hablar con un humano => handoff_human + audit

-- Pega aquí resultados (qa_test_results):
-- INSERT INTO public.qa_test_results (...) VALUES (...);

-- ============================================================
-- Fase 1 — Inbound / Descubrimiento
-- ============================================================
-- - saludo + “lavado a domicilio” => pedir vehículo + comuna
-- - “¿Qué servicios ofrecen?” => send_service_menu
-- - “¿Cuánto se demoran?” => answer_question + CTA

-- ============================================================
-- Fase 2 — Cotización
-- ============================================================
-- - “SUV en Las Condes quiero cotizar” => send_quote
-- - “Quiero cotizar” (sin datos) => ask_missing_data
-- - normalizaciones: jeep/nunoa
-- - pricing fallback: hatchback/sedan (si aplica)

-- ============================================================
-- Fase 3 — Booking end-to-end (3+ steps)
-- ============================================================
-- 1) Cotiza => "Agendar" => offer_available_slots (3+ opciones)
-- 2) Selección 1/2/3 => collect_address si falta
-- 3) Dirección => confirm_address
-- 4) Confirmación => confirm_booking

-- ============================================================
-- Fase 4 — Seguimiento / Objeciones
-- ============================================================
-- - “Ya, después te aviso” => schedule_followup
-- - “Está caro” / “Lo voy a pensar” => answer_objection (copy completo)

-- ============================================================
-- Fase 5 — Críticos (cancel/reagendar/handoff)
-- ============================================================
-- - crear reserva y luego cancelar => audita ambas acciones
-- - reagendar => reschedule_booking
-- - handoff + “urgente” posterior => audit + lock

-- ============================================================
-- Fase 6 — Robustez / Observabilidad
-- ============================================================
-- - 2 mensajes seguidos => merge contexto
-- - mensaje duplicado => no duplica efectos
-- - provider_error => alternativa + audit/log

