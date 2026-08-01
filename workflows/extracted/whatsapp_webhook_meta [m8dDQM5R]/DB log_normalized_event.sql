-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: whatsapp_webhook_meta  (workflow id m8dDQM5RVoQ0q2lC)
-- Nodo:        DB log_normalized_event
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH payload AS (
  SELECT
    '{{ JSON.stringify($json.normalized_event || {}).replace(/'/g, "''") }}'::jsonb AS event,
    '{{ JSON.stringify($json.audit || {}).replace(/'/g, "''") }}'::jsonb AS audit,
    '{{ String($json.environment || "production").replace(/'/g, "''") }}'::text AS environment,
    {{ $json.is_active ? 'true' : 'false' }}::boolean AS is_active,
    '{{ String($json.default_agent || "").replace(/'/g, "''") }}'::text AS default_agent,
    '{{ String($json.business_name || "").replace(/'/g, "''") }}'::text AS business_name
), ins AS (
  INSERT INTO public.whatsapp_webhook_logs (
    idempotency_key, event_type, phone_number_id, message_id, lead_id, normalized_ok, error, normalized_event, raw, event_received_at
  )
  SELECT
    COALESCE(event->>'idempotency_key', 'wa_missing_' || gen_random_uuid()::text),
    COALESCE(event->>'event_type', 'unknown'),
    NULLIF(event->>'phone_number_id', ''),
    NULLIF(event->>'message_id', ''),
    NULLIF(event->>'lead_id', ''),
    COALESCE((audit->>'normalized_ok')::boolean, true),
    NULLIF(audit->>'error', ''),
    event,
    COALESCE(event->'raw', '{}'::jsonb),
    NOW()
  FROM payload
  ON CONFLICT (idempotency_key) DO UPDATE SET
    event_received_at = EXCLUDED.event_received_at,
    normalized_event = EXCLUDED.normalized_event,
    raw = EXCLUDED.raw
  RETURNING *
)
SELECT
  event AS normalized_event,
  jsonb_build_object('phone_number_id', event->>'phone_number_id', 'environment', environment) AS routing,
  environment, is_active, NULLIF(default_agent, '') AS default_agent, NULLIF(business_name, '') AS business_name,
  (event->>'event_type') AS event_type,
  (SELECT id FROM ins LIMIT 1) AS log_id;
