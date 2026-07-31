-- PRD QA Suite Closer Comercial
-- Lote 8: casos 35 a 39 del PRD
-- scenario_key: 569900436 - 569900440

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900436',
  'PRD QA436: spam_detection reconduce mensajes irrelevantes',
  'prd_phase_g',
  true,
  2,
  ARRAY['prd','phase_g','spam_detection','medium','noise','guardrails'],
  '[
    {
      "role":"user",
      "text":"asdf ??? 0000 zzzz",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","answer_question","send_service_menu"],
        "tool_name_any":["message.send"],
        "response_includes_any":["servicio","lavado","ayudarte","cotizar","agendar","Que servicio te interesa"],
        "response_not_includes":["reserva confirmada","horario reservado","cita confirmada"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900437',
  'PRD QA437: audio_message_handling procesa transcript de audio',
  'prd_phase_g',
  true,
  2,
  ARRAY['prd','phase_g','audio_message_handling','medium','media','voice'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi SUV en Huechuraba",
      "message_type":"audio",
      "attachments":[
        {
          "type":"audio",
          "id":"qa-audio-437-1",
          "mime_type":"audio/ogg",
          "voice":true
        }
      ],
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","ask_missing_data"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["lavado premium","suv","huechuraba","cotizacion","cotizar"],
        "response_not_includes":["No entendi","audio no soportado","imagen no soportada"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900438',
  'PRD QA438: image_message_handling procesa imagen con contexto comercial',
  'prd_phase_g',
  true,
  2,
  ARRAY['prd','phase_g','image_message_handling','medium','media','image'],
  '[
    {
      "role":"user",
      "text":"Quiero cotizar lavado premium para mi auto en Providencia",
      "message_type":"image",
      "attachments":[
        {
          "type":"image",
          "id":"qa-image-438-1",
          "mime_type":"image/jpeg",
          "caption":"Foto del auto para cotizar"
        }
      ],
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","ask_missing_data","recommend_service"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["lavado premium","providencia","cotizacion","cotizar","auto"],
        "response_not_includes":["No entendi","imagen no soportada","audio no soportado"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900439',
  'PRD QA439: multiple_messages_merge une mensajes cortos separados',
  'prd_phase_g',
  true,
  1,
  ARRAY['prd','phase_g','multiple_messages_merge','high','merge','context'],
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
      "text":"Quiero cotizar",
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
      "text":"lavado premium",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","send_quote","answer_question"],
        "tool_name_any":["message.send","quote.create"]
      }
    },
    {
      "role":"user",
      "text":"para mi SUV",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data","send_quote"],
        "tool_name_any":["message.send","quote.create"]
      }
    },
    {
      "role":"user",
      "text":"en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes":["lavado premium","suv","huechuraba"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900440',
  'PRD QA440: conversation_summary resume correctamente el contexto',
  'prd_phase_g',
  true,
  1,
  ARRAY['prd','phase_g','conversation_summary','high','summary','memory'],
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
        "tool_name_any":["quote.create","message.send"]
      }
    },
    {
      "role":"user",
      "text":"Me resumes lo que hemos hablado hasta ahora?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question","ask_missing_data","send_quote"],
        "tool_name_any":["message.send","quote.create"],
        "response_includes":["lavado premium","suv","huechuraba"],
        "response_not_includes":["No entiendo","no recuerdo","no tengo contexto"]
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
WHERE scenario_key BETWEEN '569900436' AND '569900440'
ORDER BY scenario_key;
