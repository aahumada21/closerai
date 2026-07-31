-- QA479: pregunta precio, entrega vehiculo/comuna y recibe lista de precios de 3 servicios
-- scenario_key: 569900479

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900479',
  'QA479: cotizacion lista precios con vehiculo y comuna',
  'ux_sales_quote',
  true,
  1,
  ARRAY['ux','quote','price','sales','price_list','continuation'],
  '[
    {
      "role":"user",
      "text":"hola cuanto sale lavar un auto",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["ask_missing_data"],
        "decision_action_any":["ask_missing_data"],
        "tool_name_any":["message.send"],
        "response_includes_any":["lista de precios de los 3 servicios","Que vehiculo tienes","En que comuna seria el servicio"],
        "response_not_includes":["Que servicio quieres","Tenemos 3 opciones","null","undefined","NaN"]
      }
    },
    {
      "role":"user",
      "text":"estoy en huechuraba, tengo un suv",
      "source_metadata":{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"},
      "expect":{
        "must_have_audit":true,
        "must_have_agent":true,
        "must_have_organization":true,
        "last_bot_action_any":["send_quote"],
        "decision_action_any":["send_quote"],
        "tool_name_any":["quote.create","message.send"],
        "response_includes_any":["estos son los valores","lavado basico","lavado premium","encerado full","$30.000","$40.000","$70.000"],
        "response_not_includes":["Tenemos 3 opciones","Cual te interesa?","Que servicio quieres","null","undefined","NaN"]
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
WHERE scenario_key = '569900479';
