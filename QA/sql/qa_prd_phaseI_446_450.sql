-- PRD QA Suite Closer Comercial
-- Lote 10: casos 45 a 49 del PRD
-- scenario_key: 569900446 - 569900450

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900446',
  'PRD QA446: low_confidence_detection pide aclaracion cuando no esta seguro',
  'prd_phase_i',
  true,
  1,
  ARRAY['prd','phase_i','low_confidence_detection','critical','guardrails'],
  '[
    {
      "role":"user",
      "text":"Quiero eso que vi el otro dia, lo mas bacan, cuanto sale?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","send_service_menu","recommend_service"],
        "tool_name_any":["message.send"],
        "response_includes_any":["servicio","cual","que servicio","lavado","recomendar","orientarte","datos"],
        "response_not_includes":["$10.000","$20.000","$30.000","$40.000","$80.000","reserva confirmada","cita confirmada"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900447',
  'PRD QA447: duplicate_message_protection evita procesar dos veces mismo mensaje',
  'prd_phase_i',
  true,
  1,
  ARRAY['prd','phase_i','duplicate_message_protection','critical','idempotency','message'],
  '[
    {
      "role":"user",
      "text":"Hola, quiero cotizar lavado premium para mi SUV en Huechuraba",
      "message_id":"qa_prd_447_duplicate_message",
      "wait_ms":8000,
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
      "text":"Hola, quiero cotizar lavado premium para mi SUV en Huechuraba",
      "message_id":"qa_prd_447_duplicate_message",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "should_process":false
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900448',
  'PRD QA448: idempotency_booking evita crear dos citas iguales',
  'prd_phase_i',
  true,
  1,
  ARRAY['prd','phase_i','idempotency_booking','critical','booking','idempotency'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para SUV en Huechuraba y quiero agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","offer_available_slots","ask_missing_data"],
        "tool_name_any":["quote.create","calendar.availability","message.send"]
      }
    },
    {
      "role":"user",
      "text":"Agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots"],
        "tool_name_any":["calendar.availability"]
      }
    },
    {
      "role":"user",
      "text":"1",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["collect_address"],
        "tool_name_any":["message.send"]
      }
    },
    {
      "role":"user",
      "text":"Av Santa Maria 1234",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_address"],
        "tool_name_any":["message.send"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "message_id":"qa_prd_448_confirm_booking_once",
      "wait_ms":8000,
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "stage_any":["booked"],
        "response_includes_any":["confirmada","reserva","agendada"],
        "response_not_includes":["ya no esta disponible","Necesito un poco"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "message_id":"qa_prd_448_confirm_booking_once",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "should_process":false
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900449',
  'PRD QA449: conversation_recovery continua bien despues de mensaje confuso',
  'prd_phase_i',
  true,
  2,
  ARRAY['prd','phase_i','conversation_recovery','high','recovery'],
  '[
    {
      "role":"user",
      "text":"Hola",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","send_service_menu","answer_question"],
        "tool_name_any":["message.send"]
      }
    },
    {
      "role":"user",
      "text":"??? me enrede, no se",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","send_service_menu"],
        "tool_name_any":["message.send"],
        "response_not_includes":["error","null","undefined"]
      }
    },
    {
      "role":"user",
      "text":"Ya, quiero lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","ask_missing_data"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["lavado premium","suv","huechuraba","cotizacion","cotizar"],
        "response_not_includes":["No entiendo","error","null","undefined"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900450',
  'PRD QA450: analytics_tracking deja evidencia comercial auditable',
  'prd_phase_i',
  true,
  2,
  ARRAY['prd','phase_i','analytics_tracking','high','analytics','audit'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote"],
        "decision_action_any":["send_quote"],
        "tool_name_any":["quote.create"],
        "response_includes_any":["$40.000","40.000","40000","lavado premium","agendar"]
      }
    },
    {
      "role":"user",
      "text":"Si, quiero agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots","ask_missing_data"],
        "tool_name_any":["calendar.availability","message.send"],
        "response_not_includes":["error","null","undefined"]
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
WHERE scenario_key BETWEEN '569900446' AND '569900450'
ORDER BY scenario_key;
