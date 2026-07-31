INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900232',
  'TEMP QA232: booking e2e opcion 1 + confirm_booking',
  'temp',
  true,
  1,
  ARRAY['temp','qa232','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Huechuraba","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"camino del roble 1251 casa 34","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900233',
  'TEMP QA233: booking e2e opcion 2 + confirm_booking',
  'temp',
  true,
  1,
  ARRAY['temp','qa233','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Las Condes","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av las condes 1234 depto 56","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900234',
  'TEMP QA234: booking e2e sedan + opcion 3',
  'temp',
  true,
  1,
  ARRAY['temp','qa234','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Providencia","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"3","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av providencia 2450","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si confirmo","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900235',
  'TEMP QA235: booking e2e hatchback + opcion 1',
  'temp',
  true,
  1,
  ARRAY['temp','qa235','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Hatchback, Nunoa","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"irarrazaval 3200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Dale confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900236',
  'TEMP QA236: booking e2e pickup + opcion 2',
  'temp',
  true,
  1,
  ARRAY['temp','qa236','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Pickup, Maipu","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"pajaritos 15000","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar ahora","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900237',
  'TEMP QA237: booking e2e suv + opcion 3',
  'temp',
  true,
  1,
  ARRAY['temp','qa237','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Santiago Centro","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"3","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"san diego 500","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmemos","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900238',
  'TEMP QA238: booking e2e sedan + opcion 1',
  'temp',
  true,
  1,
  ARRAY['temp','qa238','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Puente Alto","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"concha y toro 2200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmo la reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900239',
  'TEMP QA239: booking e2e suv + opcion 2',
  'temp',
  true,
  1,
  ARRAY['temp','qa239','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, La Florida","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"vicuña mackenna 9800","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900240',
  'TEMP QA240: booking e2e coupe + opcion 3',
  'temp',
  true,
  1,
  ARRAY['temp','qa240','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Coupe, Quilicura","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"3","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"lo cruzat 1200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar por favor","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900241',
  'TEMP QA241: booking e2e suv + opcion 2 final',
  'temp',
  true,
  1,
  ARRAY['temp','qa241','phase3','booking_e2e','confirm_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, San Miguel","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"gran avenida 5200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}}
  ]'::jsonb,
  now(),
  now()
);
