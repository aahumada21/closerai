-- PRD QA Suite Closer Comercial
-- Lote 7: casos 31 a 35 del PRD
-- scenario_key: 569900431 - 569900435

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900431',
  'PRD QA431: human_handoff deriva correctamente a humano',
  'prd_phase_f',
  true,
  1,
  ARRAY['prd','phase_f','human_handoff','critical','handoff'],
  '[
    {
      "role":"user",
      "text":"Necesito hablar con una persona del equipo ahora",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human","answer_question","answer_objection"],
        "tool_name_any":["handoff.create","message.send"],
        "response_includes_any":["persona","humano","equipo","derivar","ayudarte"],
        "response_not_includes":["Que servicio te interesa","agendar","horarios disponibles"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900432',
  'PRD QA432: stop_after_handoff mantiene lock y no vuelve a vender',
  'prd_phase_f',
  true,
  1,
  ARRAY['prd','phase_f','stop_after_handoff','critical','handoff','lock'],
  '[
    {
      "role":"user",
      "text":"Quiero que me atienda una persona por favor",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human","answer_question","answer_objection"],
        "tool_name_any":["handoff.create","message.send"],
        "response_includes_any":["persona","humano","equipo","derivar"]
      }
    },
    {
      "role":"user",
      "text":"Ya, pero igual quiero cotizar lavado premium ahora",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human"],
        "tool_name_any":["handoff.create","message.send"],
        "response_includes_any":["ya esta derivado","persona","equipo","mismo chat","revisara"],
        "response_not_includes":["Lavado premium","Que servicio te interesa","agendar","horarios disponibles"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900433',
  'PRD QA433: resume_after_handoff mantiene lock hasta reactivacion interna',
  'prd_phase_f',
  true,
  2,
  ARRAY['prd','phase_f','resume_after_handoff','high','handoff','reactivation'],
  '[
    {
      "role":"user",
      "text":"Necesito hablar con un humano",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human","answer_question","answer_objection"],
        "tool_name_any":["handoff.create","message.send"],
        "response_includes_any":["humano","persona","equipo","derivar"]
      }
    },
    {
      "role":"user",
      "text":"Listo, ya me ayudaron. Quiero seguir contigo para cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human"],
        "tool_name_any":["handoff.create","message.send"],
        "response_includes_any":["ya esta derivado","persona","equipo","mismo chat","revisara"],
        "response_not_includes":["No entiendo","cotizacion","cotizar","agendar","horarios disponibles"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900434',
  'PRD QA434: out_of_scope_question maneja preguntas fuera del negocio',
  'prd_phase_f',
  true,
  2,
  ARRAY['prd','phase_f','out_of_scope_question','high','faq','scope'],
  '[
    {
      "role":"user",
      "text":"Cual es la capital de Japon?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","send_service_menu","ask_missing_data"],
        "tool_name_any":["message.send"],
        "response_includes_any":["servicio","lavado","puedo ayudarte","cotizar","agendar"],
        "response_not_includes":["Tokio","tokio","Japon","japon"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900435',
  'PRD QA435: spam_detection ignora o reconduce mensajes irrelevantes',
  'prd_phase_f',
  true,
  2,
  ARRAY['prd','phase_f','spam_detection','medium','noise','guardrails'],
  '[
    {
      "role":"user",
      "text":"asdf asdf ... ???",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","send_service_menu"],
        "tool_name_any":["message.send"],
        "response_includes_any":["servicio","ayudarte","lavado","cotizar","agendar","Que servicio te interesa"],
        "response_not_includes":["reserva confirmada","horario reservado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
)
ON CONFLICT (scenario_key) DO UPDATE
SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  updated_at = now();

SELECT scenario_key, enabled, name, updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key BETWEEN '569900431' AND '569900435'
ORDER BY scenario_key;
