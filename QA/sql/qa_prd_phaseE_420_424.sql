-- PRD QA Suite Closer Comercial
-- Lote 6: casos 26 a 30 del PRD
-- scenario_key: 569900420 - 569900424

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900420',
  'PRD QA420: quote_followup hace seguimiento despues de cotizar',
  'prd_phase_e',
  true,
  1,
  ARRAY['prd','phase_e','quote_followup','critical','followup','quote'],
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
        "tool_name_any":["quote.create"],
        "response_includes_any":["$40.000","40.000","40000","agendar"]
      }
    },
    {
      "role":"user",
      "text":"Aun no decido, escribeme manana para recordarmelo",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["schedule_followup","answer_question","answer_objection"],
        "tool_name_any":["followup.schedule","message.send"],
        "response_includes_any":["seguimiento","te escribo","manana","mañana","recordar","aviso"],
        "response_not_includes":["reserva confirmada","agendado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900421',
  'PRD QA421: post_service_message contacta despues del trabajo',
  'prd_phase_e',
  true,
  2,
  ARRAY['prd','phase_e','post_service_message','high','post_service'],
  '[
    {
      "role":"user",
      "text":"El lavado quedo impecable, muchas gracias por el servicio",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["request_review","answer_question","answer_objection"],
        "tool_name_any":["message.send","review.request"],
        "response_includes_any":["gracias","resena","reseña","opinion","opinión","testimonio"],
        "response_not_includes":["Que servicio te interesa","que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900422',
  'PRD QA422: request_review solicita resena o testimonio',
  'prd_phase_e',
  true,
  2,
  ARRAY['prd','phase_e','request_review','high','review','post_service'],
  '[
    {
      "role":"user",
      "text":"Quede muy conforme con el trabajo, te puedo dejar una resena?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["request_review","answer_question"],
        "tool_name_any":["message.send","review.request"],
        "response_includes_any":["resena","reseña","gracias","testimonio","opinion","opinión"],
        "response_not_includes":["Que servicio te interesa","agendar"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900423',
  'PRD QA423: reactivate_old_customer recupera cliente antiguo',
  'prd_phase_e',
  true,
  2,
  ARRAY['prd','phase_e','reactivate_old_customer','medium','reactivation','commercial'],
  '[
    {
      "role":"user",
      "text":"Hola, hace meses lave con ustedes y quiero volver a cotizar para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","answer_question","offer_booking"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["cotizar","premium","agendar","horario","servicio"],
        "response_not_includes":["No entiendo","Que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900424',
  'PRD QA424: detect_angry_customer detecta reclamo y deriva a humano',
  'prd_phase_e',
  true,
  1,
  ARRAY['prd','phase_e','detect_angry_customer','critical','handoff','complaint'],
  '[
    {
      "role":"user",
      "text":"Estoy muy molesto, el servicio fue pesimo y quiero hacer un reclamo ahora",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["handoff_human","answer_question","answer_objection"],
        "tool_name_any":["message.send","handoff.create"],
        "response_includes_any":["reclamo","ayudarte","equipo","humano","derivar","soporte"],
        "response_not_includes":["Que servicio te interesa","agendar"]
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
WHERE scenario_key BETWEEN '569900420' AND '569900424'
ORDER BY scenario_key;
