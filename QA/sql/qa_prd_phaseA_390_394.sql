-- PRD QA Suite Closer Comercial
-- Lote 1: casos 1 a 5 del PRD
-- scenario_key: 569900390 - 569900394

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900390',
  'PRD QA390: new_lead_creation crea lead y responde primer siguiente paso',
  'prd_phase_a',
  true,
  1,
  ARRAY['prd','phase_a','new_lead','critical','audit'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["ask_missing_data"],
        "response_includes_any":["servicio","interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900391',
  'PRD QA391: identify_returning_lead mantiene contexto y no reinicia discovery',
  'prd_phase_a',
  true,
  1,
  ARRAY['prd','phase_a','returning_lead','critical','context'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["ask_missing_data"]
      }
    },
    {
      "role":"user",
      "text":"Es para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_quote"]
      }
    },
    {
      "role":"user",
      "text":"Volvi, quiero agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["offer_available_slots"],
        "response_not_includes":["Que servicio te interesa","que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900392',
  'PRD QA392: collect_name toma nombre implicito sin pedirlo de nuevo',
  'prd_phase_a',
  true,
  1,
  ARRAY['prd','phase_a','collect_name','high','identity'],
  '[
    {
      "role":"user",
      "text":"Hola, soy Matias",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["ask_missing_data"],
        "response_includes_any":["servicio","interesa"],
        "response_not_includes":["como te llamas","cuál es tu nombre","cual es tu nombre"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900393',
  'PRD QA393: collect_vehicle_type detecta SUV y no vuelve a pedir tipo de vehiculo',
  'prd_phase_a',
  true,
  1,
  ARRAY['prd','phase_a','collect_vehicle_type','critical','extraction'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["ask_missing_data"],
        "response_includes_any":["comuna","donde","seria el servicio"],
        "response_not_includes":["tipo de vehiculo","que vehiculo","que tipo de vehiculo"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900394',
  'PRD QA394: collect_district detecta comuna valida y dispara cotizacion',
  'prd_phase_a',
  true,
  1,
  ARRAY['prd','phase_a','collect_district','critical','quote_trigger'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_quote"],
        "response_not_includes":["en que comuna","que comuna","donde seria el servicio"]
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
WHERE scenario_key BETWEEN '569900390' AND '569900394'
ORDER BY scenario_key;
