-- PRD QA Suite Closer Comercial
-- Lote 3: casos 11 a 15 del PRD
-- scenario_key: 569900400 - 569900404

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900400',
  'PRD QA400: upsell_service sugiere mejora sin presionar',
  'prd_phase_b',
  true,
  3,
  ARRAY['prd','phase_b','upsell_service','medium','commercial'],
  '[
    {
      "role":"user",
      "text":"Quiero lavado basico para mi SUV en Huechuraba",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote","recommend_service","answer_question"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["premium","basico","básico","lavado"],
        "response_not_includes":["obligatorio","debes tomar","solo puedo"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900401',
  'PRD QA401: answer_general_question responde duda frecuente',
  'prd_phase_b',
  true,
  2,
  ARRAY['prd','phase_b','answer_general_question','high','faq'],
  '[
    {
      "role":"user",
      "text":"Atienden en Huechuraba y trabajan a domicilio?",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["Huechuraba","domicilio","servicio"],
        "response_not_includes":["Que servicio te interesa","que servicio te interesa"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900402',
  'PRD QA402: answer_price_objection maneja muy caro',
  'prd_phase_b',
  true,
  1,
  ARRAY['prd','phase_b','answer_price_objection','critical','objection'],
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
        "response_includes_any":["$40.000","40.000","40000"]
      }
    },
    {
      "role":"user",
      "text":"Esta muy caro",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_objection","answer_question","offer_booking"],
        "tool_name_any":["message.send"],
        "response_includes_any":["entiendo","valor","premium","incluye","calidad"],
        "response_not_includes":["te lo dejo a","descuento inventado","puedo bajar"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900403',
  'PRD QA403: answer_delay_objection maneja lo veo despues',
  'prd_phase_b',
  true,
  2,
  ARRAY['prd','phase_b','answer_delay_objection','high','followup'],
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
      "text":"Lo veo despues y te aviso",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["schedule_followup","answer_objection","answer_question"],
        "response_includes_any":["perfecto","aviso","pendiente","cuando quieras","seguimiento"],
        "response_not_includes":["agenda ahora","tienes que agendar","pierdes el precio"]
      }
    }
  ]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  '569900404',
  'PRD QA404: competitor_comparison maneja otro cobra mas barato',
  'prd_phase_b',
  true,
  2,
  ARRAY['prd','phase_b','competitor_comparison','high','objection'],
  '[
    {
      "role":"user",
      "text":"Otro lugar me cobra mas barato por el lavado premium",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["answer_objection","answer_question"],
        "tool_name_any":["message.send"],
        "response_includes_any":["incluye","calidad","servicio","comparar"],
        "response_not_includes":["son malos","mejor que todos","te igualo el precio"]
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
WHERE scenario_key BETWEEN '569900400' AND '569900404'
ORDER BY scenario_key;
