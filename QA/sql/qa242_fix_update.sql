UPDATE public.qa_test_scenarios_temp
SET
  name = 'TEMP QA242: crear reserva y luego cancelar (audit completo)',
  steps = '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Huechuraba","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"camino del roble 1251","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero cancelar la reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["cancel_booking"]}}
  ]'::jsonb,
  updated_at = now()
WHERE scenario_key = '569900242';
