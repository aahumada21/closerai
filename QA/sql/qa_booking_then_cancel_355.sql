-- QA: agendar una hora y luego cancelar la reserva
-- scenario_key: 569900355

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900355',
  'TEMP QA355: booking e2e confirma y cancela reserva',
  'temp',
  true,
  1,
  ARRAY['temp','qa355','booking','select_slot','confirm_booking','cancel_booking','audit','critical'],
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
      "text":"Quiero cotizar lavado premium",
      "expect":{
        "must_have_audit":true
      }
    },
    {
      "role":"user",
      "text":"SUV, Huechuraba",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["send_quote"]
      }
    },
    {
      "role":"user",
      "text":"Agendar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["offer_available_slots"]
      }
    },
    {
      "role":"user",
      "text":"1",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["collect_address","confirm_address"]
      }
    },
    {
      "role":"user",
      "text":"camino del roble 1251 casa 34",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_address"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["confirm_booking"]
      }
    },
    {
      "role":"user",
      "text":"Quiero cancelar la reserva",
      "expect":{
        "must_have_audit":true,
        "last_bot_action_any":["cancel_booking"]
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
WHERE scenario_key = '569900355';
