-- PRD QA Suite Closer Comercial
-- Lote 4: casos 16 a 20 del PRD
-- scenario_key: 569900405 - 569900409

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900405',
  'PRD QA405: offer_booking intenta llevar la conversacion a agenda',
  'prd_phase_c',
  true,
  1,
  ARRAY['prd','phase_c','offer_booking','critical','booking'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","offer_booking"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["agendar","agenda","te gustaria agendar","te gustaría agendar"],
        "response_not_includes":["No pude calcular","no encontre precio","manual"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900406',
  'PRD QA406: check_availability consulta horarios reales',
  'prd_phase_c',
  true,
  1,
  ARRAY['prd','phase_c','check_availability','critical','availability'],
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
        "tool_name_any":["quote.create"]
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
        "tool_name_any":["calendar.availability"],
        "response_includes_any":["horarios disponibles","tengo estos horarios","opcion","opción","1"],
        "response_not_includes":["inventado","sin revisar"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900407',
  'PRD QA407: suggest_slots propone opciones claras al cliente',
  'prd_phase_c',
  true,
  1,
  ARRAY['prd','phase_c','suggest_slots','critical','availability'],
  '[
    {
      "role":"user",
      "text":"Hola, quiero agendar lavado premium para una SUV en Huechuraba",
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
      "text":"Si, muestrame horarios disponibles",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots"],
        "tool_name_any":["calendar.availability"],
        "response_includes_any":["1","2","3","horarios disponibles","cual te acomoda","cuál te acomoda"],
        "response_not_includes":["No inventare","no puedo ayudarte"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900408',
  'PRD QA408: confirm_booking crea reserva correctamente',
  'prd_phase_c',
  true,
  1,
  ARRAY['prd','phase_c','confirm_booking','critical','booking'],
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
        "tool_name_any":["quote.create"]
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
        "tool_name_any":["message.send"],
        "response_includes_any":["direccion","dirección","donde seria","donde sería"]
      }
    },
    {
      "role":"user",
      "text":"camino del roble 1251 casa 34",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_address"],
        "tool_name_any":["message.send"],
        "response_includes_any":["confirmar","reserva","direccion","dirección"]
      }
    },
    {
      "role":"user",
      "text":"Si, confirmar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "expected_stage":"booked",
        "response_includes_any":["reserva confirmada","confirmada","agendada"],
        "response_not_includes":["ya no esta disponible","ya no está disponible","Necesito un poco"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900409',
  'PRD QA409: send_booking_confirmation envia resumen completo de cita',
  'prd_phase_c',
  true,
  1,
  ARRAY['prd','phase_c','send_booking_confirmation','critical','booking_summary'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para camioneta en Huechuraba y quiero agendar",
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
      "text":"2",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["collect_address","offer_available_slots"],
        "tool_name_any":["message.send","calendar.availability"],
        "response_not_includes":["esa opcion no esta disponible","esa opción no está disponible"]
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
      "text":"Confirmo la reserva",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "expected_stage":"booked",
        "response_includes_any":["reserva","confirmada","camioneta","Huechuraba","Av Santa Maria"],
        "response_not_includes":["ya no esta disponible","ya no está disponible","Necesito un poco"]
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
WHERE scenario_key BETWEEN '569900405' AND '569900409'
ORDER BY scenario_key;
