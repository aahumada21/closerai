-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 1 whatsapp_inbound_adapter  (workflow id a5202fbc-eded-44b4-a98a-492a742c1368)
-- Nodo:        DB log_whatsapp_status
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH payload AS (
  SELECT
    '{{ String($json.idempotency_key || "").replace(/'/g, "''") }}'::text AS idempotency_key,
    NULLIF('{{ String($json.external_channel_id || $json.phone_number_id || "").replace(/'/g, "''") }}', '') AS phone_number_id,
    NULLIF('{{ String($json.message_id || "").replace(/'/g, "''") }}', '') AS message_id,
    NULLIF('{{ String($json.lead_id || "").replace(/'/g, "''") }}', '') AS lead_id,
    '{{ JSON.stringify($json || {}).replace(/'/g, "''") }}'::jsonb AS normalized_event,
    '{{ JSON.stringify($json.raw || {}).replace(/'/g, "''") }}'::jsonb AS raw
), inserted AS (
  INSERT INTO public.whatsapp_webhook_logs (
    idempotency_key,
    event_type,
    phone_number_id,
    message_id,
    lead_id,
    normalized_ok,
    error,
    normalized_event,
    raw,
    event_received_at
  )
  SELECT
    idempotency_key,
    'status',
    phone_number_id,
    message_id,
    lead_id,
    true,
    NULL,
    normalized_event,
    raw,
    NOW()
  FROM payload
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.whatsapp_webhook_logs existing
    WHERE existing.idempotency_key = payload.idempotency_key
  )
  RETURNING id
)
SELECT COALESCE((SELECT id::text FROM inserted LIMIT 1), 'already_logged') AS log_result;
