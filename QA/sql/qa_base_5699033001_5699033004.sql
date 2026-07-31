INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5699033001', 'BASE 08: cancelar reserva existente', 'closer_base_flows', true, 15, ARRAY['base','decision_tree','cancel','fixture']::text[], '[{"role":"user","text":"Quiero cancelar mi reserva del jueves","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["cancel_booking"]}}]'::jsonb, 'El bot debe reconocer que el lead tiene una reserva activa y cancelarla. Nota: el paso de borrar el evento en Google Calendar puede fallar porque el event_id del fixture es ficticio -- lo que se valida es que la decision de rules_engine sea cancelar, no el resultado final en el calendario real.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5699033002', 'BASE 09: reagendar reserva existente', 'closer_base_flows', true, 15, ARRAY['base','decision_tree','reschedule','fixture']::text[], '[{"role":"user","text":"Necesito cambiar mi hora, puede ser el viernes?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["reschedule_booking"]}}]'::jsonb, 'El bot debe reconocer que el lead tiene una reserva activa y comenzar el proceso de reprogramarla. Nota: la actualizacion real del evento en Google Calendar puede fallar porque el event_id del fixture es ficticio -- lo que se valida es que la decision de rules_engine sea reagendar, no el resultado final en el calendario real.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5699033003', 'BASE 10: post-servicio -- resena y referido encadenados', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','post_service','fixture']::text[], '[{"role":"user","text":"Quedo increible el auto, quede muy conforme!","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["request_review"]}},{"role":"user","text":"Le voy a contar a mi hermana para que tambien los llame","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["request_referral"]}}]'::jsonb, 'El bot debe pedir una resena cuando el lead da feedback positivo despues del servicio, y luego pedir un referido cuando el lead menciona que va a recomendar el negocio.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();

INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5699033004', 'BASE 11: consultar si tengo una reserva agendada', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','existing_appointment','fixture']::text[], '[{"role":"user","text":"Tengo alguna reserva agendada?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}}]'::jsonb, 'El bot debe confirmarle al lead que si tiene una reserva activa agendada, mencionando los detalles.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();
