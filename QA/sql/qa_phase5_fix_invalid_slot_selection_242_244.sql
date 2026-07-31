-- Corrige diseño de escenario QA (slot inválido) para 569900242 y 569900244
-- Fuerza selección de opción "1" tras offer_available_slots.

UPDATE public.qa_test_scenarios_temp
SET
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

UPDATE public.qa_test_scenarios_temp
SET
  steps = '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Providencia","expect":{"must_have_audit":true,"allowed_last_bot_action":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"allowed_last_bot_action":["offer_available_slots"]}},
    {"role":"user","text":"1","expect":{"must_have_audit":true,"allowed_last_bot_action":["collect_address"]}},
    {"role":"user","text":"av providencia 2450","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_address"]}},
    {"role":"user","text":"Si, confirmar","expect":{"must_have_audit":true,"allowed_last_bot_action":["confirm_booking"]}},
    {"role":"user","text":"Quiero cambiar la hora de mi reserva","expect":{"must_have_audit":true,"allowed_last_bot_action":["reschedule_booking"]}}
  ]'::jsonb,
  updated_at = now()
WHERE scenario_key = '569900244';
