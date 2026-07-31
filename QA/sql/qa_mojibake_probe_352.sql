-- QA específico para validar mojibake + respuesta real (sin ack stub)
-- scenario_key: 569900352

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900352',
  'TEMP QA352: utf8_and_real_bot_response_guard',
  'temp',
  true,
  1,
  ARRAY['temp','qa352','utf8','mojibake','no_stub','critical'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "expect":{
        "must_have_audit":true,
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium",
      "expect":{
        "must_have_audit":true,
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"SUV, Providencia",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_quote"],
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"Agendar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["offer_available_slots"],
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"1",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["collect_address","confirm_booking","confirm_address"],
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"av providencia 2450",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_address","confirm_booking"],
        "response_not_includes":["�","Ã","Â","Workflow was started"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_booking","offer_available_slots","reschedule_booking"],
        "response_not_includes":["�","Ã","Â","Workflow was started"]
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
  enabled = true,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  updated_at = now();

SELECT scenario_key, enabled, name, updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key = '569900352';
