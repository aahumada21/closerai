-- PRD QA Suite Closer Comercial
-- Lote 12: casos 56 a 57 del PRD conversacional
-- scenario_key: 569900457 - 569900458
--
-- Nota:
-- - Caso 58 webhook_meta_verification es HTTP GET y vive en scripts/qa_verify_meta_webhook.ps1.

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900457',
  'PRD QA457: agent_config_services menu sale desde agent_business_config',
  'prd_phase_k',
  true,
  1,
  ARRAY['prd','phase_k','agent_config_services','critical','multiagent','config'],
  '[
    {
      "role":"user",
      "text":"Que servicios tienen?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_service_menu","answer_question"],
        "decision_action_any":["send_service_menu","answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["polarizado","lamina","servicio"],
        "response_not_includes":["Lavado premium","lavado premium","Encerado full","encerado full","QA Lavado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900458',
  'PRD QA458: encoding_mojibake_guard respuestas sin mojibake',
  'prd_phase_k',
  true,
  1,
  ARRAY['prd','phase_k','encoding_mojibake_guard','critical','encoding','ux'],
  '[
    {
      "role":"user",
      "text":"Hola, quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","ask_missing_data"],
        "decision_action_any":["send_quote","ask_missing_data"],
        "tool_name_any":["quote.create","message.send"],
        "response_not_includes":["�","├","┬","Â","Ã","ï¿½","undefined","null"]
      }
    },
    {
      "role":"user",
      "text":"Si, quiero agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots","ask_missing_data"],
        "decision_action_any":["offer_available_slots","ask_missing_data"],
        "tool_name_any":["calendar.availability","message.send"],
        "response_not_includes":["�","├","┬","Â","Ã","ï¿½","undefined","null"]
      }
    },
    {
      "role":"user",
      "text":"Que incluye el lavado premium?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","send_service_menu","ask_missing_data"],
        "decision_action_any":["answer_question","send_service_menu","ask_missing_data"],
        "tool_name_any":["message.send"],
        "response_not_includes":["�","├","┬","Â","Ã","ï¿½","undefined","null"]
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
WHERE scenario_key BETWEEN '569900457' AND '569900458'
ORDER BY scenario_key;
