-- QA478: pregunta precio debe pedir vehiculo/comuna y ofrecer lista de precios de 3 servicios
-- scenario_key: 569900478

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900478',
  'QA478: pregunta precio pide vehiculo comuna y promete lista de precios',
  'ux_sales_quote',
  true,
  1,
  ARRAY['ux','quote','price','sales','missing_context','price_list'],
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
        "response_includes_any":["lista de precios de los 3 servicios","Que vehiculo tienes","En que comuna seria el servicio","lavado basico, lavado premium y encerado full"],
        "response_not_includes":["Que servicio quieres","que servicio quieres","Tenemos 3 opciones","Cual te interesa?","null","undefined","NaN"]
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
WHERE scenario_key = '569900478';
