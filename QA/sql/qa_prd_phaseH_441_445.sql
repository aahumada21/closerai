-- PRD QA Suite Closer Comercial
-- Lote 9: casos 40 a 44 del PRD
-- scenario_key: 569900441 - 569900445

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900441',
  'PRD QA441: state_persistence mantiene contexto entre pasos',
  'prd_phase_h',
  true,
  1,
  ARRAY['prd','phase_h','state_persistence','critical','memory','context'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","ask_missing_data"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["lavado premium","suv","huechuraba","cotizacion","cotizar"]
      }
    },
    {
      "role":"user",
      "text":"Y que datos tienes de mi solicitud?",
      "wait_ms":6000,
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","send_quote","ask_missing_data"],
        "tool_name_any":["message.send","quote.create"],
        "response_includes":["lavado premium","suv","huechuraba"],
        "response_not_includes":["no recuerdo","no tengo contexto","No entiendo"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900442',
  'PRD QA442: business_hours_rule no agenda fuera de horario configurado',
  'prd_phase_h',
  true,
  2,
  ARRAY['prd','phase_h','business_hours_rule','high','booking','guardrails'],
  '[
    {
      "role":"user",
      "text":"Quiero agendar lavado premium para mi SUV en Huechuraba a las 3 de la manana",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","ask_missing_data","offer_available_slots","send_quote"],
        "tool_name_any":["message.send","calendar.availability","quote.create"],
        "response_includes_any":["horario","disponible","agenda","servicio","cotizar","09:00","9:00"],
        "response_not_includes":["reserva confirmada","cita confirmada","confirmada para las 3","03:00 a. m.","3 de la manana"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900443',
  'PRD QA443: service_area_rule maneja comuna fuera de cobertura',
  'prd_phase_h',
  true,
  1,
  ARRAY['prd','phase_h','service_area_rule','critical','coverage','guardrails'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para mi SUV en La Serena",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","ask_missing_data","handoff_human","send_quote"],
        "tool_name_any":["message.send","handoff.create","quote.create"],
        "response_includes_any":["zona","cobertura","comuna","La Serena","la serena","servicio","recargo","manual"],
        "response_not_includes":["reserva confirmada","horario reservado","cita confirmada"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900444',
  'PRD QA444: price_rule_validation no inventa precios para servicio no configurado',
  'prd_phase_h',
  true,
  1,
  ARRAY['prd','phase_h','price_rule_validation','critical','pricing','guardrails'],
  '[
    {
      "role":"user",
      "text":"Cuanto sale instalar blindaje ceramico aeroespacial para una avioneta en Rancagua?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","ask_missing_data","handoff_human","send_service_menu"],
        "tool_name_any":["message.send","handoff.create"],
        "response_includes_any":["servicio","no tengo","no manejo","equipo","manual","puedo ayudarte","lavado"],
        "response_not_includes":["$10.000","$20.000","$30.000","$40.000","$50.000","$80.000","reserva confirmada","Te lo dejo"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900445',
  'PRD QA445: availability_rule_validation no inventa horarios sin datos suficientes',
  'prd_phase_h',
  true,
  1,
  ARRAY['prd','phase_h','availability_rule_validation','critical','availability','guardrails'],
  '[
    {
      "role":"user",
      "text":"Dame horarios disponibles para manana",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","send_service_menu"],
        "tool_name_any":["message.send"],
        "response_includes_any":["servicio","comuna","vehiculo","datos","necesito","interesa"],
        "response_not_includes":["1.","2.","3.","09:00","15:00","horarios disponibles","reserva confirmada","cita confirmada"]
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
  enabled = EXCLUDED.enabled,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  updated_at = now();

SELECT scenario_key, enabled, name, updated_at
FROM public.qa_test_scenarios_temp
WHERE scenario_key BETWEEN '569900441' AND '569900445'
ORDER BY scenario_key;
