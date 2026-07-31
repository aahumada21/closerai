-- QA: consulta informativa sobre que es el servicio y que incluye
-- scenario_key: 569900356

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900356',
  'TEMP QA356: FAQ lavado premium que es y que incluye',
  'temp',
  true,
  1,
  ARRAY['temp','qa356','faq','answer_question','service_info','lavado_premium','audit'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "expect":{
        "must_have_audit":true
      }
    },
    {
      "role":"user",
      "text":"Que es el lavado premium y que incluye?",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["answer_question"]
      }
    },
    {
      "role":"user",
      "text":"Y ese servicio es a domicilio?",
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
WHERE scenario_key = '569900356';
