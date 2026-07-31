-- PRD QA Suite Closer Comercial
-- Lote 2: casos 6 a 10 del PRD
-- scenario_key: 569900395 - 569900399

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900395',
  'PRD QA395: collect_service_interest detecta lavado premium',
  'prd_phase_b',
  true,
  1,
  ARRAY['prd','phase_b','collect_service_interest','critical','extraction'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data"],
        "tool_name_any":["message.send"],
        "response_includes_any":["comuna","vehiculo","vehículo"],
        "response_not_includes":["Que servicio te interesa","que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900396',
  'PRD QA396: ask_missing_data pide solo comuna cuando faltan datos minimos',
  'prd_phase_b',
  true,
  1,
  ARRAY['prd','phase_b','ask_missing_data','critical','missing_fields'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data"],
        "tool_name_any":["message.send"],
        "response_includes_any":["comuna","donde","seria el servicio"],
        "response_not_includes":["servicio te interesa","tipo de vehiculo","que vehiculo","que tipo de vehiculo"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900397',
  'PRD QA397: send_quote entrega precio correcto con contexto completo',
  'prd_phase_b',
  true,
  1,
  ARRAY['prd','phase_b','send_quote','critical','pricing'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote"],
        "tool_name_any":["quote.create"],
        "response_includes_any":["$40.000","40000","40.000"],
        "response_not_includes":["No pude calcular","manual","no encontre precio"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900398',
  'PRD QA398: quote_explanation explica que incluye lavado premium',
  'prd_phase_b',
  true,
  2,
  ARRAY['prd','phase_b','quote_explanation','high','faq'],
  '[
    {
      "role":"user",
      "text":"Que incluye el lavado premium?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["premium","limpieza","interior","exterior"],
        "response_not_includes":["Que servicio te interesa","que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900399',
  'PRD QA399: recommend_service recomienda premium segun necesidad',
  'prd_phase_b',
  true,
  2,
  ARRAY['prd','phase_b','recommend_service','high','recommendation'],
  '[
    {
      "role":"user",
      "text":"Mi auto esta muy sucio por dentro y por fuera, que me recomiendas?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["recommend_service","ask_missing_data","answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["premium","lavado premium","recomiendo"],
        "response_not_includes":["No se","no puedo ayudarte"]
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
WHERE scenario_key BETWEEN '569900395' AND '569900399'
ORDER BY scenario_key;
