INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ('5693300001', 'BASE 01: flujo completo descubrimiento -> cotizacion -> agenda -> direccion -> confirmacion', 'closer_base_flows', true, 10, ARRAY['base','decision_tree','booking','happy_path']::text[], '[{"role":"user","text":"Hola, quiero el lavado premium","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"must_have_agent":true,"must_have_organization":true,"decision_action_any":["ask_missing_data"],"response_not_includes":["null","undefined","NaN"]}},{"role":"user","text":"Vivo en Las Condes, tengo un SUV","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_quote"],"response_not_includes":["null","undefined","NaN"]}},{"role":"user","text":"Dale, quiero agendar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["offer_available_slots"],"response_includes_any":["Flow","link de pago"],"response_not_includes":["null","undefined","NaN"]}},{"role":"user","text":"El jueves a las 15:00","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["collect_address","offer_available_slots","answer_question"],"response_not_includes":["null","undefined","NaN"]}},{"role":"user","text":"Mi direccion es Av. Apoquindo 4500","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["confirm_address","confirm_booking"],"response_not_includes":["null","undefined","NaN"]}},{"role":"user","text":"Si, confirmo la reserva","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["confirm_booking","offer_available_slots","confirm_address"],"response_not_includes":["null","undefined","NaN"]}}]'::jsonb, 'El bot debe guiar al lead desde el saludo inicial hasta una reserva confirmada: pide la comuna que falta, cotiza al recibir vehiculo y comuna, ofrece horarios (mencionando el link de pago por Flow ya que el negocio esta en modo prepago_only), pide la direccion, la confirma, y finalmente confirma la reserva.', 'base')
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
  ('5693300002', 'BASE 02: preguntas frecuentes independientes (bot, menu, detalle, horario finde, cobertura)', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','faq']::text[], '[{"role":"user","text":"Eres un bot o hablo con una persona?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["ask_missing_data","answer_question"],"response_includes_any":["asistente virtual","Ahumada Detailing"]}},{"role":"user","text":"Que servicios tienen?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_service_menu"]}},{"role":"user","text":"Que incluye el lavado premium?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}},{"role":"user","text":"Atienden los domingos?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}},{"role":"user","text":"Cubren la comuna de Maipu?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question"]}}]'::jsonb, 'El bot debe responder cada pregunta informativa de forma directa y correcta: aclara que es un asistente virtual, envia el menu de servicios, explica que incluye el lavado premium, responde si atienden domingos, y responde si cubren la comuna de Maipu -- sin pedir datos de reserva todavia.', 'base')
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
  ('5693300003', 'BASE 03: recomendacion de servicio (indeciso y auto muy sucio)', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','recommendation']::text[], '[{"role":"user","text":"No se cual elegir, que me recomiendas para mi auto?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["recommend_service"]}},{"role":"user","text":"Tengo una camioneta en Las Condes, esta muy sucia, tiene barro y manchas por todos lados","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["ask_missing_data","recommend_service","send_quote"]}}]'::jsonb, 'El bot debe ofrecer una recomendacion cuando el usuario no sabe que servicio elegir, y por separado recomendar especificamente el servicio premium cuando el usuario describe el auto como muy sucio.', 'base')
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
  ('5693300004', 'BASE 04: cotizacion -> pide alternativa mas barata -> pide que le avisen despues', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','objection','followup']::text[], '[{"role":"user","text":"Hola quiero cotizar el encerado full, tengo un sedan en La Reina","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_quote","ask_missing_data"]}},{"role":"user","text":"Uy que caro, tienen algo mas barato?","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_quote"]}},{"role":"user","text":"Mejor avisame despues, lo voy a pensar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["schedule_followup","answer_objection"]}}]'::jsonb, 'El bot debe cotizar el servicio pedido, ofrecer una alternativa mas economica cuando el usuario dice que esta caro, y agendar un seguimiento cuando el usuario dice que lo va a pensar y le avisen despues.', 'base')
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
  ('5693300005', 'BASE 05: cotizacion -> agenda -> rechaza los horarios ofrecidos', 'closer_base_flows', true, 20, ARRAY['base','decision_tree','booking','objection']::text[], '[{"role":"user","text":"Hola quiero el lavado basico, city car, Nunoa","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["send_quote"]}},{"role":"user","text":"Dale, quiero agendar","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["offer_available_slots"]}},{"role":"user","text":"No, ninguno de esos horarios me sirve","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_objection"]}}]'::jsonb, 'El bot debe cotizar, ofrecer horarios disponibles, y responder apropiadamente cuando el usuario dice que ninguno de los horarios ofrecidos le sirve.', 'base')
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
  ('5693300006', 'BASE 06: derivacion explicita a un humano', 'closer_base_flows', true, 15, ARRAY['base','decision_tree','handoff']::text[], '[{"role":"user","text":"Quiero hablar con una persona del equipo, por favor","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["handoff_human"]}}]'::jsonb, 'El bot debe derivar la conversacion a una persona del equipo cuando el usuario lo pide explicitamente.', 'base')
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
  ('5693300007', 'BASE 07: reclamo del cliente', 'closer_base_flows', true, 15, ARRAY['base','decision_tree','complaint','handoff']::text[], '[{"role":"user","text":"Tengo un reclamo, el servicio del otro dia quedo pesimo","source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},"expect":{"must_have_audit":true,"decision_action_any":["answer_question","handoff_human"]}}]'::jsonb, 'El bot debe reconocer el reclamo del cliente y derivar la conversacion a un humano (stage human_handoff), sin intentar resolverlo el mismo.', 'base')
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();
