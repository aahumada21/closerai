-- PRD QA Suite Closer Comercial
-- Lote 5: casos 21 a 25 del PRD
-- scenario_key: 569900410 - 569900414

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900410',
  'PRD QA410: modify_booking cambia fecha u hora existente',
  'prd_phase_d',
  true,
  1,
  ARRAY['prd','phase_d','modify_booking','critical','reschedule_booking'],
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
        "tool_name_any":["message.send"],
        "response_includes_any":["direccion","dirección","donde seria","donde sería"]
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
        "response_includes_any":["confirmada","reserva","agendada"],
        "response_not_includes":["ya no esta disponible","ya no está disponible","Necesito un poco"]
      }
    },
    {
      "role":"user",
      "text":"Quiero cambiar la hora",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_reschedule_slots","reschedule_booking","offer_available_slots"],
        "tool_name_any":["calendar.availability","calendar.reschedule_booking","message.send"],
        "response_includes_any":["horarios","opciones","cambiar","reagendar","reprogramar","1"],
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
        "last_bot_action_any":["reschedule_booking"],
        "tool_name_any":["calendar.reschedule_booking"],
        "stage_any":["booked"],
        "response_includes_any":["cambio","reagendada","reprogramada","reprogramado","actualizada"],
        "response_not_includes":["No encontre una reserva activa","No encontré una reserva activa","mismo horario"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900411',
  'PRD QA411: cancel_booking cancela y libera horario',
  'prd_phase_d',
  true,
  1,
  ARRAY['prd','phase_d','cancel_booking','critical','booking'],
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
      "text":"2",
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
        "response_includes_any":["confirmada","reserva"],
        "response_not_includes":["ya no esta disponible","ya no está disponible"]
      }
    },
    {
      "role":"user",
      "text":"Cancela mi reserva por favor",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["cancel_booking"],
        "tool_name_any":["calendar.cancel_booking"],
        "response_includes_any":["cancelada","cancelar","anulada"],
        "response_not_includes":["No encontre reserva activa","No encontré reserva activa"]
      }
    },
    {
      "role":"user",
      "text":"Quiero volver a agendar",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["offer_available_slots","ask_missing_data"],
        "tool_name_any":["calendar.availability","message.send"],
        "response_not_includes":["No encontre reserva activa","No encontré reserva activa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900412',
  'PRD QA412: prevent_double_booking evita dos reservas mismo horario',
  'prd_phase_d',
  true,
  1,
  ARRAY['prd','phase_d','prevent_double_booking','critical','idempotency','booking'],
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
      "text":"3",
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
        "response_includes_any":["confirmada","reserva"],
        "response_not_includes":["ya no esta disponible","ya no está disponible"]
      }
    },
    {
      "role":"user",
      "text":"Confirma otra reserva para el mismo horario",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","ask_missing_data","offer_available_slots","confirm_booking"],
        "tool_name_any":["message.send","calendar.availability","calendar.create_booking"],
        "response_includes_any":["ya tienes","reserva activa","cambiar","reagendar","cancelar","otro horario","no puedo","horarios disponibles","Cual te acomoda","Cuál te acomoda","1."],
        "response_not_includes":["dos reservas","duplicada","duplicado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900413',
  'PRD QA413: appointment_reminder confirma recordatorio automatico',
  'prd_phase_d',
  true,
  2,
  ARRAY['prd','phase_d','appointment_reminder','high','followup','booking'],
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
      "text":"3",
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
        "response_includes_any":["confirmada","reserva","te escribire antes","te escribiré antes","coordinar"]
      }
    },
    {
      "role":"user",
      "text":"Me puedes recordar antes de la visita?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","schedule_followup","send_pre_service_instructions"],
        "tool_name_any":["message.send","followup.schedule"],
        "response_includes_any":["te escribire","te escribiré","recordatorio","antes","avisar","coordinar"],
        "response_not_includes":["No encontre reserva activa","No encontré reserva activa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900414',
  'PRD QA414: no_response_followup recupera cliente que desaparece',
  'prd_phase_d',
  true,
  1,
  ARRAY['prd','phase_d','no_response_followup','critical','followup','quote'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote"],
        "tool_name_any":["quote.create"],
        "response_includes_any":["$40.000","40.000","40000","agendar"]
      }
    },
    {
      "role":"user",
      "text":"Lo veo despues y te aviso",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["schedule_followup","answer_objection","answer_question"],
        "tool_name_any":["followup.schedule","message.send"],
        "response_includes_any":["perfecto","aviso","pendiente","cuando quieras","seguimiento","quedo atento"],
        "response_not_includes":["agendado","confirmada","reserva confirmada"]
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
WHERE scenario_key BETWEEN '569900410' AND '569900414'
ORDER BY scenario_key;
