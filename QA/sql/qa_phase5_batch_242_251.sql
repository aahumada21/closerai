INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900242',
  'TEMP QA242: crear reserva y luego cancelar (audit completo)',
  'temp',
  true,
  1,
  ARRAY['temp','qa242','phase5','cancel_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Huechuraba","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"camino del roble 1251","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero cancelar la reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900243',
  'TEMP QA243: crear reserva y luego cancelar (variante comuna)',
  'temp',
  true,
  1,
  ARRAY['temp','qa243','phase5','cancel_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Las Condes","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av las condes 1234","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Cancela mi reserva por favor","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900244',
  'TEMP QA244: crear reserva y luego reagendar',
  'temp',
  true,
  1,
  ARRAY['temp','qa244','phase5','reschedule_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Providencia","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"3","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av providencia 2450","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero cambiar la hora de mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900245',
  'TEMP QA245: crear reserva y luego reagendar (variante)',
  'temp',
  true,
  1,
  ARRAY['temp','qa245','phase5','reschedule_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Hatchback, Nunoa","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"irarrazaval 3200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Necesito reagendar para otro dia","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900246',
  'TEMP QA246: handoff explicito y luego urgente (lock)',
  'temp',
  true,
  1,
  ARRAY['temp','qa246','phase5','handoff_human','urgent_guard','audit','critical'],
  '[
    {"role":"user","text":"Necesito hablar con un humano","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"Es urgente","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900247',
  'TEMP QA247: handoff explicito y urgencia posterior',
  'temp',
  true,
  1,
  ARRAY['temp','qa247','phase5','handoff_human','urgent_guard','audit','critical'],
  '[
    {"role":"user","text":"Quiero que me atienda una persona","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"Por favor es muy urgente","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900248',
  'TEMP QA248: cancelar sin reserva activa',
  'temp',
  true,
  1,
  ARRAY['temp','qa248','phase5','cancel_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cancelar mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900249',
  'TEMP QA249: reagendar sin reserva activa',
  'temp',
  true,
  1,
  ARRAY['temp','qa249','phase5','reschedule_booking','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cambiar mi hora de reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900250',
  'TEMP QA250: crear reserva, confirmar y cancelar inmediato',
  'temp',
  true,
  1,
  ARRAY['temp','qa250','phase5','confirm_booking','cancel_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, San Miguel","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"gran avenida 5200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Mejor cancela","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900251',
  'TEMP QA251: crear reserva, confirmar y reagendar',
  'temp',
  true,
  1,
  ARRAY['temp','qa251','phase5','confirm_booking','reschedule_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Maipu","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"2","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"pajaritos 15000","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero reagendar para la proxima semana","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
);
