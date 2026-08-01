-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: whatsapp_webhook_meta  (workflow id xlTFn6jLFMnjB2mF)
-- Nodo:        DB load_number_config
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH cfg AS (
  SELECT phone_number_id, waba_id, display_phone_number, business_name, environment, is_active, default_agent
  FROM public.whatsapp_numbers
  WHERE phone_number_id = '{{ String($json.routing.phone_number_id || "").replace(/'/g, "''") }}'
  LIMIT 1
)
SELECT
  '{{ JSON.stringify($json.normalized_event || {}).replace(/'/g, "''") }}'::jsonb AS normalized_event,
  '{{ JSON.stringify($json.routing || {}).replace(/'/g, "''") }}'::jsonb AS routing,
  '{{ JSON.stringify($json.audit || {}).replace(/'/g, "''") }}'::jsonb AS audit,
  COALESCE((SELECT environment FROM cfg), 'production') AS environment,
  COALESCE((SELECT is_active FROM cfg), true) AS is_active,
  (SELECT default_agent FROM cfg) AS default_agent,
  (SELECT business_name FROM cfg) AS business_name;
