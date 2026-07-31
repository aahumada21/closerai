-- QA473: cotizacion inicial sin contexto no debe mostrar menu largo
-- scenario_key: 569900473

INSERT INTO public.qa_test_scenarios_temp
(id, scenario_key, name, suite, enabled, priority, tags, steps, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  '569900473',
  'QA473: pregunta precio lavar auto pide datos de cotizacion sin menu largo',
  'ux_sales_quote',
  true,
  1,
  ARRAY['ux','quote','price','sales','missing_context'],
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
        "response_includes_any":["valor depende","tamano","vehiculo","auto, SUV o camioneta","SUV","camioneta"],
        "response_not_includes":["Tenemos 3 opciones","Lavado basico: mantencion","Lavado premium: limpieza","Encerado full: proteccion","Cual te interesa? Si no estas seguro"]
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
WHERE scenario_key = '569900473';
