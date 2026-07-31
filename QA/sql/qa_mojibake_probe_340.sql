-- QA específico para validar mojibake en respuestas del bot
-- scenario_key: 569900351

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900351',
  'TEMP QA351: utf8_mojibake_guard_end_to_end',
  'temp',
  true,
  1,
  ARRAY['temp','qa351','utf8','mojibake','critical'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "expect":{
        "must_have_audit":true,
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium",
      "expect":{
        "must_have_audit":true,
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"SUV, Providencia",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_quote"],
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"Agendar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["offer_available_slots"],
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"1",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["collect_address","confirm_booking","confirm_address"],
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"av providencia 2450",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_address","confirm_booking"],
        "response_not_includes":["�","Ã","Â"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_booking","offer_available_slots","reschedule_booking"],
        "response_not_includes":["�","Ã","Â"]
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
WHERE scenario_key = '569900351';
