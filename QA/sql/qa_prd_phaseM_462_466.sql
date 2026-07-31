-- PRD QA Suite Closer Comercial
-- Lote 13: casos 61 a 65 del PRD
-- scenario_key: 569900462 - 569900466
--
-- Objetivo:
-- - Validar bordes criticos de agenda/precio sin romper el pipeline actual.
-- - Estos QA son conversacionales; no hacen setup externo de calendario.

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900462',
  'PRD QA462: calendar_slot_race ofrece alternativas si el slot se ocupa',
  'prd_phase_m',
  true,
  1,
  ARRAY['prd','phase_m','calendar_slot_race','critical','booking','availability'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para SUV en Huechuraba y quiero agendar durante las proximas dos semanas",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","offer_available_slots","ask_missing_data"],
        "tool_name_any":["quote.create","calendar.availability","message.send"],
        "response_not_includes":["error","undefined","null"]
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
        "response_includes_any":["1","horarios","disponibles","opcion","opción"]
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
        "response_includes_any":["direccion","dirección","donde"]
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
        "tool_name_any":["message.send"],
        "response_includes_any":["confirmar","reserva","direccion","dirección"]
      }
    },
    {
      "role":"user",
      "text":"Si al confirmar ese horario aparece ocupado, proponme otros horarios",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking","offer_available_slots","answer_question"],
        "tool_name_any":["calendar.create_booking","calendar.availability","message.send"],
        "response_not_includes":["error","undefined","null","Necesito un poco"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900463',
  'PRD QA463: booking_then_cancel_then_rebook reutiliza contexto previo',
  'prd_phase_m',
  true,
  1,
  ARRAY['prd','phase_m','booking_then_cancel_then_rebook','critical','booking','cancel_booking'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para SUV en Huechuraba y quiero agendar durante las proximas dos semanas",
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
      "text":"Confirmo la reserva",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "stage_any":["booked"],
        "response_includes_any":["confirmada","reserva","agendada"],
        "response_not_includes":["ya no esta disponible","ya no está disponible"]
      }
    },
    {
      "role":"user",
      "text":"Cancela mi reserva",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["cancel_booking"],
        "tool_name_any":["calendar.cancel_booking"],
        "response_includes_any":["cancelada","anulada","cancelar"],
        "response_not_includes":["No encontre reserva activa","No encontré reserva activa"]
      }
    },
    {
      "role":"user",
      "text":"Quiero volver a agendar el mismo lavado",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots","ask_missing_data","send_quote"],
        "tool_name_any":["calendar.availability","message.send","quote.create"],
        "response_not_includes":["que servicio te interesa","Que servicio te interesa","tipo de vehiculo","comuna"]
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
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "stage_any":["booked"],
        "response_includes_any":["confirmada","reserva","agendada"],
        "response_not_includes":["Necesito un poco mas de informacion","Necesito un poco más de información","que servicio te interesa","tipo de vehiculo","comuna"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900464',
  'PRD QA464: reschedule_to_different_slot no usa el mismo slot anterior',
  'prd_phase_m',
  true,
  1,
  ARRAY['prd','phase_m','reschedule_to_different_slot','critical','reschedule_booking'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para SUV en Huechuraba y quiero agendar durante las proximas dos semanas",
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
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["confirm_booking"],
        "tool_name_any":["calendar.create_booking"],
        "stage_any":["booked"],
        "response_includes_any":["confirmada","reserva","agendada"]
      }
    },
    {
      "role":"user",
      "text":"Quiero cambiar la hora a otra distinta",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_reschedule_slots","offer_available_slots","reschedule_booking"],
        "tool_name_any":["calendar.availability","calendar.reschedule_booking","message.send"],
        "response_includes_any":["horarios","opciones","otra","distinta","1"],
        "response_not_includes":["No encontre una reserva activa","No encontré una reserva activa"]
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
        "last_bot_action_any":["reschedule_booking","offer_available_slots"],
        "tool_name_any":["calendar.reschedule_booking","calendar.availability","message.send"],
        "stage_any":["booked"],
        "response_not_includes":["mismo horario","misma hora","No encontre una reserva activa","No encontré una reserva activa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900465',
  'PRD QA465: stale_booking_options no acepta opciones antiguas tras nueva disponibilidad',
  'prd_phase_m',
  true,
  1,
  ARRAY['prd','phase_m','stale_booking_options','critical','availability','booking_options'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado premium para SUV en Huechuraba y quiero agendar durante las proximas dos semanas",
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
      "text":"Muestrame otros horarios disponibles",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots"],
        "tool_name_any":["calendar.availability"],
        "response_includes_any":["horarios","disponibles","1"]
      }
    },
    {
      "role":"user",
      "text":"Quiero usar la opcion antigua que me diste antes, la 1 anterior",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots","answer_question","collect_address"],
        "tool_name_any":["calendar.availability","message.send"],
        "response_not_includes":["reserva confirmada","confirmada para","agendada para","booking confirmado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900466',
  'PRD QA466: pricing_missing_rule_lock bloquea booking o deriva humano',
  'prd_phase_m',
  true,
  1,
  ARRAY['prd','phase_m','pricing_missing_rule_lock','critical','pricing','guardrails'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar servicio aeroespacial ceramico graphene para auto en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","handoff_human","send_service_menu"],
        "tool_name_any":["message.send","handoff.create"],
        "response_not_includes":["$40.000","40.000","40000","reserva confirmada","agendar para","horarios disponibles"]
      }
    },
    {
      "role":"user",
      "text":"Igual quiero reservarlo ahora sin precio confirmado",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human","answer_question","ask_missing_data","send_service_menu"],
        "tool_name_any":["message.send","handoff.create"],
        "response_includes_any":["revisar","manual","humano","no puedo","servicio","precio","cotizacion","cotización","datos"],
        "response_not_includes":["reserva confirmada","confirmada","agendada","horarios disponibles","1."]
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
WHERE scenario_key BETWEEN '569900462' AND '569900466'
ORDER BY scenario_key;


