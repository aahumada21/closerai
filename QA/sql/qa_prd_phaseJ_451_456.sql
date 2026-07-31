-- PRD QA Suite Closer Comercial
-- Lote 11: casos 50 a 55 del PRD
-- scenario_key: 569900451 - 569900456
--
-- Requiere fixtures multiagente ya cargados:
-- - qa-phone-ahumada-agent-aware
-- - qa-phone-agent-lavado
-- - qa-phone-agent-polarizado
-- - qa-phone-agent-inactive

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900451',
  'PRD QA451: audit_log_complete permite revisar todo lo ocurrido',
  'prd_phase_j',
  true,
  1,
  ARRAY['prd','phase_j','audit_log_complete','critical','audit'],
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
        "response_not_includes":["error","null","undefined"]
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
        "response_not_includes":["error","null","undefined"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900452',
  'PRD QA452: multiagent_routing enruta cada phone_number_id al agente correcto',
  'prd_phase_j',
  true,
  1,
  ARRAY['prd','phase_j','multiagent_routing','critical','multiagent'],
  '[
    {
      "role":"user",
      "text":"Que servicios tienen?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-lavado"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_service_menu","answer_question"],
        "decision_action_any":["send_service_menu","answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["lavado","premium"],
        "response_not_includes":["polarizado","lamina"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900453',
  'PRD QA453: multiagent_service_isolation no mezcla servicios entre negocios',
  'prd_phase_j',
  true,
  1,
  ARRAY['prd','phase_j','multiagent_service_isolation','critical','multiagent'],
  '[
    {
      "role":"user",
      "text":"Que servicios tienen?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-polarizado"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","send_service_menu"],
        "decision_action_any":["answer_question","send_service_menu"],
        "tool_name_any":["message.send"],
        "response_includes_any":["polarizado","lamina","servicio"],
        "response_not_includes":["si tenemos lavado premium","Lavado premium","encerado full","agendar lavado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900454',
  'PRD QA454: inactive_agent_block agente inactivo no procesa mensajes',
  'prd_phase_j',
  true,
  1,
  ARRAY['prd','phase_j','inactive_agent_block','critical','multiagent','negative'],
  '[
    {
      "role":"user",
      "text":"Hola, quiero cotizar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-inactive"},
      "expect":{
        "should_process":false
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900455',
  'PRD QA455: unknown_number_block numero no configurado no procesa y audita descarte',
  'prd_phase_j',
  true,
  1,
  ARRAY['prd','phase_j','unknown_number_block','critical','multiagent','negative'],
  '[
    {
      "role":"user",
      "text":"Hola, quiero cotizar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-unknown-prd-455"},
      "expect":{
        "should_process":false
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900456',
  'PRD QA456: tool_registry_observability toda respuesta con mensaje audita message.send',
  'prd_phase_j',
  true,
  2,
  ARRAY['prd','phase_j','tool_registry_observability','high','audit','tool_registry'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-lavado"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","send_service_menu","answer_question"],
        "decision_action_any":["ask_missing_data","send_service_menu","answer_question"],
        "tool_name_any":["message.send"],
        "response_not_includes":["error","null","undefined"]
      }
    },
    {
      "role":"user",
      "text":"Que servicios tienen?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-agent-lavado"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_service_menu","answer_question"],
        "decision_action_any":["send_service_menu","answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["lavado","premium"],
        "response_not_includes":["error","null","undefined"]
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
WHERE scenario_key BETWEEN '569900451' AND '569900456'
ORDER BY scenario_key;
