-- QA: evita loop al preguntar por servicios disponibles
-- scenario_key: 569900357

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900357',
  'TEMP QA357: no repetir ask_missing_data cuando usuario pregunta servicios',
  'temp',
  true,
  1,
  ARRAY['temp','qa357','service_menu','loop_guard','send_service_menu','answer_question','audit','critical'],
  '[
    {
      "role":"user",
      "text":"Holaa",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["ask_missing_data"]
      }
    },
    {
      "role":"user",
      "text":"Que servicios tiene?",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_service_menu","answer_question"]
      }
    },
    {
      "role":"user",
      "text":"Cuales tiene?",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_service_menu","answer_question"]
      }
    },
    {
      "role":"user",
      "text":"Que incluye el lavado premium?",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["answer_question"]
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
WHERE scenario_key = '569900357';
