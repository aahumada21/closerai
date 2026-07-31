INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900262',
  'TEMP QA262: booking->reschedule estable (slot valido)',
  'temp',
  true,
  1,
  ARRAY['temp','qa262','phase5','reschedule_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Providencia","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av providencia 2450","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero cambiar la hora de mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900263',
  'TEMP QA263: booking->reschedule variante comuna',
  'temp',
  true,
  1,
  ARRAY['temp','qa263','phase5','reschedule_booking','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Hatchback, Nunoa","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"irarrazaval 3200","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Necesito reagendar para otro dia","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900264',
  'TEMP QA264: handoff explicito + urgente',
  'temp',
  true,
  1,
  ARRAY['temp','qa264','phase5','handoff_human','urgent_guard','audit','critical'],
  '[
    {"role":"user","text":"Necesito hablar con un humano","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"Es urgente","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900265',
  'TEMP QA265: handoff lock mantiene derivacion',
  'temp',
  true,
  1,
  ARRAY['temp','qa265','phase5','handoff_human','lock','audit','critical'],
  '[
    {"role":"user","text":"Quiero que me atienda una persona","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"por favor urgente","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"ademas quiero cotizar","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900266',
  'TEMP QA266: quote fail bloquea agendar',
  'temp',
  true,
  1,
  ARRAY['temp','qa266','phase5','pricing_guard','handoff_human','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Las Condes","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote","pricing_rule_not_found"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900267',
  'TEMP QA267: quote fail bloquea confirmacion',
  'temp',
  true,
  1,
  ARRAY['temp','qa267','phase5','pricing_guard','handoff_human','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Lo Barnechea","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote","pricing_rule_not_found"]}},
    {"role":"user","text":"Si, confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900268',
  'TEMP QA268: booking confirmado y cancelacion',
  'temp',
  true,
  1,
  ARRAY['temp','qa268','phase5','cancel_booking','audit','critical'],
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
  '569900269',
  'TEMP QA269: reagendar sin reserva activa',
  'temp',
  true,
  1,
  ARRAY['temp','qa269','phase5','reschedule_booking','no_active','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cambiar mi hora de reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900270',
  'TEMP QA270: cancelar sin reserva activa',
  'temp',
  true,
  1,
  ARRAY['temp','qa270','phase5','cancel_booking','no_active','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cancelar mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900271',
  'TEMP QA271: acentos y ñ en comuna/direccion',
  'temp',
  true,
  1,
  ARRAY['temp','qa271','phase5','encoding','confirm_address','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Ñuñoa","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"Avenida José Pedro Alessandri 1234","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}}
  ]'::jsonb,
  now(),
  now()
);
