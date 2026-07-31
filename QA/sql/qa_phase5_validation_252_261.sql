INSERT INTO "public"."qa_test_scenarios_temp"
("id","scenario_key","name","suite","enabled","priority","tags","steps","created_at","updated_at")
VALUES
(
  gen_random_uuid(),
  '569900252',
  'TEMP QA252: booking->reschedule con auditoria completa',
  'temp',
  true,
  1,
  ARRAY['temp','qa252','phase5','reschedule_booking','audit','critical'],
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
  '569900253',
  'TEMP QA253: booking->reschedule variante con auditoria',
  'temp',
  true,
  1,
  ARRAY['temp','qa253','phase5','reschedule_booking','audit','critical'],
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
  '569900254',
  'TEMP QA254: handoff explicito estable + urgente',
  'temp',
  true,
  1,
  ARRAY['temp','qa254','phase5','handoff_human','urgent_guard','audit','critical'],
  '[
    {"role":"user","text":"Necesito hablar con un humano","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}},
    {"role":"user","text":"Es urgente","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900255',
  'TEMP QA255: handoff lock mantiene derivacion',
  'temp',
  true,
  1,
  ARRAY['temp','qa255','phase5','handoff_human','lock','audit','critical'],
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
  '569900256',
  'TEMP QA256: quote fail bloquea agendar (guard comercial)',
  'temp',
  true,
  1,
  ARRAY['temp','qa256','phase5','send_quote','pricing_guard','handoff_human','critical'],
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
  '569900257',
  'TEMP QA257: quote fail bloquea confirmacion posterior',
  'temp',
  true,
  1,
  ARRAY['temp','qa257','phase5','pricing_guard','handoff_human','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"Sedan, Lo Barnechea","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote","pricing_rule_not_found"]}},
    {"role":"user","text":"si confirmar reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["handoff_human"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900258',
  'TEMP QA258: cancelar despues de booking con auditoria',
  'temp',
  true,
  1,
  ARRAY['temp','qa258','phase5','cancel_booking','audit','critical'],
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
  '569900259',
  'TEMP QA259: reagendar sin reserva activa responde controlado',
  'temp',
  true,
  1,
  ARRAY['temp','qa259','phase5','reschedule_booking','no_active','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cambiar mi hora de reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900260',
  'TEMP QA260: cancel sin reserva activa responde controlado',
  'temp',
  true,
  1,
  ARRAY['temp','qa260','phase5','cancel_booking','no_active','audit'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cancelar mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900261',
  'TEMP QA261: flujo con tildes/acentos en direccion y comuna',
  'temp',
  true,
  1,
  ARRAY['temp','qa261','phase5','encoding','confirm_address','audit'],
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
