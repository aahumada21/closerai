-- QA361: seleccion invalida cuando hay 3 opciones de agenda.
-- Objetivo: validar que responder "4" no confirma, no pide direccion y corrige la seleccion.

INSERT INTO public.qa_test_scenarios_temp
(
  id,
  scenario_key,
  name,
  suite,
  enabled,
  priority,
  tags,
  steps,
  created_at,
  updated_at
)
VALUES
(
  gen_random_uuid(),
  '569900361',
  'TEMP QA361: seleccion invalida opcion 4 cuando hay 3 opciones',
  'temp',
  true,
  1,
  ARRAY['temp','qa361','booking','invalid_slot_option','slot_selection','audit','critical'],
  '[
    {"role":"user","text":"Hola","expect":{"must_have_audit":true}},
    {"role":"user","text":"Quiero cotizar lavado premium","expect":{"must_have_audit":true}},
    {"role":"user","text":"SUV, Huechuraba","expect":{"must_have_audit":true,"last_bot_action_any":["send_quote"]}},
    {"role":"user","text":"Agendar","expect":{"must_have_audit":true,"last_bot_action_any":["offer_available_slots"]}},
    {"role":"user","text":"4","expect":{"must_have_audit":true,"last_bot_action_any":["invalid_slot_option","answer_question"]}}
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

SELECT
  scenario_key,
  enabled,
  name,
  updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key = '569900361';
