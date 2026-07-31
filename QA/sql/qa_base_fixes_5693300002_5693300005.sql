INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5693300002', 'BASE 02: preguntas frecuentes independientes (bot, menu, detalle, horario finde, cobertura)', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','faq']::text[], '[{"role":"user","text":"Eres un bot o hablo con una persona?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["ask_missing_data","answer_question"],"response_includes_any":["asistente virtual","Ahumada Detailing"]}},{"role":"user","text":"Que servicios tienen?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_service_menu"]}},{"role":"user","text":"Que incluye el lavado premium?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}},{"role":"user","text":"Atienden los domingos?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}},{"role":"user","text":"Cubren la comuna de Maipu?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}}]'::jsonb, 'El bot debe responder cada pregunta informativa de forma directa y correcta: aclara que es un asistente virtual, envia el menu de servicios, explica que incluye el lavado premium, responde si atienden domingos, y responde si cubren la comuna de Maipu. Es normal y esperable que el menu de servicios termine invitando a dar vehiculo/comuna para cotizar -- eso no cuenta como falla.', 'base')
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
  ('5693300005', 'BASE 05: cotizacion -> agenda -> rechaza los horarios ofrecidos', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','booking','objection']::text[], '[{"role":"user","text":"Hola, tengo un city car, quiero el lavado basico en Nunoa","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_quote"]}},{"role":"user","text":"Dale, quiero agendar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["offer_available_slots"]}},{"role":"user","text":"No, ninguno de esos horarios me sirve","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_objection"]}}]'::jsonb, 'El bot debe cotizar, ofrecer horarios disponibles, y responder apropiadamente cuando el usuario dice que ninguno de los horarios ofrecidos le sirve.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();
