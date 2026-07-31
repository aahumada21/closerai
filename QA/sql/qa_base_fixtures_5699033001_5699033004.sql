-- Fixtures para los escenarios base que necesitan una reserva / estado previo
-- ya existente (no se re-testea el flujo de agenda completo, ver
-- QA/GUide/QA_BASE_SCENARIOS_PLAN_2026-07-18.md). Los telefonos de estos 4
-- escenarios usan el prefijo literal '56990' a proposito -- el runner de QA
-- (9.1.1 qa_run_single_conversation) usa el scenario_key TAL CUAL como
-- telefono de prueba solo cuando arranca con '56990'; con cualquier otro
-- prefijo el telefono se genera random en cada corrida y no se puede atar
-- un fixture de antemano.
--
-- ADVERTENCIA: 5699033001 (cancelar) y 5699033002 (reagendar) van a intentar
-- tocar un evento real de Google Calendar (event_id ficticio aca) -- es
-- esperable que esa llamada especifica falle o no encuentre el evento; lo que
-- valida el escenario es que rules_engine rutee a la accion correcta
-- (cancel_booking / reschedule_booking), no el resultado final en el
-- calendario real.

-- Reusar si ya existen (idempotente)
DELETE FROM public.leads WHERE phone IN ('5699033001','5699033002','5699033003','5699033004');

-- ============================================================
-- 5699033001 -- Cancelar reserva (necesita reserva activa)
-- ============================================================
WITH new_lead AS (
  INSERT INTO public.leads (channel, external_id, phone, name, organization_id, agent_id)
  VALUES ('whatsapp', '5699033001', '5699033001', 'Cliente QA', '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d')
  RETURNING id
)
INSERT INTO public.lead_state (
  lead_id, stage, service_interest, vehicle_type, district,
  last_bot_action, next_goal, human_handoff,
  service_address, address_confirmed, payment_preference, payment_mode,
  booking_date, booking_time,
  organization_id, agent_id
)
SELECT id, 'booked', 'lavado_premium', 'SUV', 'Las Condes',
       'confirm_booking', 'complete_service', false,
       'Av Apoquindo 4500', true, 'prepago', 'prepago_only',
       to_char(now() + interval '3 days', 'YYYY-MM-DD'), '15:00',
       '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d'
FROM new_lead;

INSERT INTO public.appointments (event_id, conversation_id, start_at, end_at, summary, description, status, service_address)
SELECT 'qa-fixture-5699033001', l.id, now() + interval '3 days', now() + interval '3 days' + interval '2 hours',
       'lavado_premium - Cliente QA', 'Fixture QA base -- cancelar reserva', 'confirmed', 'Av Apoquindo 4500'
FROM public.leads l WHERE l.phone = '5699033001';

-- ============================================================
-- 5699033002 -- Reagendar reserva (necesita reserva activa)
-- ============================================================
WITH new_lead AS (
  INSERT INTO public.leads (channel, external_id, phone, name, organization_id, agent_id)
  VALUES ('whatsapp', '5699033002', '5699033002', 'Cliente QA', '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d')
  RETURNING id
)
INSERT INTO public.lead_state (
  lead_id, stage, service_interest, vehicle_type, district,
  last_bot_action, next_goal, human_handoff,
  service_address, address_confirmed, payment_preference, payment_mode,
  booking_date, booking_time,
  organization_id, agent_id
)
SELECT id, 'booked', 'lavado_basico', 'Hatchback', 'Nunoa',
       'confirm_booking', 'complete_service', false,
       'Av Irarrazaval 2000', true, 'prepago', 'prepago_only',
       to_char(now() + interval '4 days', 'YYYY-MM-DD'), '10:00',
       '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d'
FROM new_lead;

INSERT INTO public.appointments (event_id, conversation_id, start_at, end_at, summary, description, status, service_address)
SELECT 'qa-fixture-5699033002', l.id, now() + interval '4 days', now() + interval '4 days' + interval '2 hours',
       'lavado_basico - Cliente QA', 'Fixture QA base -- reagendar reserva', 'confirmed', 'Av Irarrazaval 2000'
FROM public.leads l WHERE l.phone = '5699033002';

-- ============================================================
-- 5699033003 -- Post-servicio: resena + referido (stage=post_service)
-- ============================================================
WITH new_lead AS (
  INSERT INTO public.leads (channel, external_id, phone, name, organization_id, agent_id)
  VALUES ('whatsapp', '5699033003', '5699033003', 'Cliente QA', '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d')
  RETURNING id
)
INSERT INTO public.lead_state (
  lead_id, stage, service_interest, vehicle_type, district,
  last_bot_action, next_goal, human_handoff,
  service_address, address_confirmed, payment_preference, payment_mode,
  organization_id, agent_id
)
SELECT id, 'post_service', 'encerado_full', 'Sedan', 'La Reina',
       'send_pre_service_instructions', 'request_review', false,
       'Av Larrain 3000', true, 'prepago', 'prepago_only',
       '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d'
FROM new_lead;

INSERT INTO public.appointments (event_id, conversation_id, start_at, end_at, summary, description, status, service_address, completed_at)
SELECT 'qa-fixture-5699033003', l.id, now() - interval '1 day', now() - interval '1 day' + interval '2 hours',
       'encerado_full - Cliente QA', 'Fixture QA base -- post-servicio', 'confirmed', 'Av Larrain 3000', now() - interval '1 hour'
FROM public.leads l WHERE l.phone = '5699033003';

-- ============================================================
-- 5699033004 -- Consultar reserva existente (necesita reserva activa)
-- ============================================================
WITH new_lead AS (
  INSERT INTO public.leads (channel, external_id, phone, name, organization_id, agent_id)
  VALUES ('whatsapp', '5699033004', '5699033004', 'Cliente QA', '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d')
  RETURNING id
)
INSERT INTO public.lead_state (
  lead_id, stage, service_interest, vehicle_type, district,
  last_bot_action, next_goal, human_handoff,
  service_address, address_confirmed, payment_preference, payment_mode,
  booking_date, booking_time,
  organization_id, agent_id
)
SELECT id, 'booked', 'lavado_premium', 'City Car', 'Providencia',
       'confirm_booking', 'complete_service', false,
       'Av Providencia 1500', true, 'prepago', 'prepago_only',
       to_char(now() + interval '5 days', 'YYYY-MM-DD'), '11:00',
       '0f709b9c-23b3-4fd5-9fd5-db11a767d364', '90351a2d-1c0c-4918-b3ef-b4cef1f3df9d'
FROM new_lead;

INSERT INTO public.appointments (event_id, conversation_id, start_at, end_at, summary, description, status, service_address)
SELECT 'qa-fixture-5699033004', l.id, now() + interval '5 days', now() + interval '5 days' + interval '2 hours',
       'lavado_premium - Cliente QA', 'Fixture QA base -- consultar reserva existente', 'confirmed', 'Av Providencia 1500'
FROM public.leads l WHERE l.phone = '5699033004';

-- Verificacion rapida
SELECT l.phone, ls.stage, ls.last_bot_action, a.event_id, a.status
FROM public.leads l
JOIN public.lead_state ls ON ls.lead_id = l.id
LEFT JOIN public.appointments a ON a.conversation_id = l.id
WHERE l.phone IN ('5699033001','5699033002','5699033003','5699033004')
ORDER BY l.phone;
