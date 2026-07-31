INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900229',
  'TEMP QA229: confirm_booking sin fallback + audit consistente (post-fix final)',
  'temp',
  true,
  1,
  ARRAY['temp','qa229','phase5','confirm_booking','availability_confirmed','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Huechuraba","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"3","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"camino del roble 1251 casa 34","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
);
