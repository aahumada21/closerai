-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        get_last_audit
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

WITH expected AS (
  SELECT
    '{{ $("build_inbound_payload").item.json.qa_message_id }}'::text AS qa_message_id,
    '{{ ($("build_inbound_payload").item.json.text || "").replace(/'/g, "''") }}'::text AS step_text,
    '{{ $("build_inbound_payload").item.json.sent_at }}'::timestamptz AS sent_at
),
matched AS (
  SELECT
    a.flow_name::text AS flow_name,
    a.decision AS decision,
    a.meta AS meta,
    a.idempotency_key::text AS idempotency_key,
    a.inbound_message_id::text AS inbound_message_id,
    a.outbound_message_id::text AS outbound_message_id,
    a.latest_user_message::text AS latest_user_message,
    a.created_at AS created_at,
    CASE
      WHEN COALESCE(a.idempotency_key::text, '') ILIKE '%' || e.qa_message_id || '%' THEN 0
      WHEN COALESCE(a.inbound_message_id::text, '') = e.qa_message_id THEN 1
      ELSE 2
    END AS match_rank
  FROM public.audit_logs a
  CROSS JOIN expected e
  WHERE a.lead_id::text = '{{ $("get_lead").item.json.id }}'
    AND a.created_at >= (e.sent_at - interval '5 seconds')
    AND a.created_at <= (e.sent_at + interval '300 seconds')
    AND (
      COALESCE(a.idempotency_key::text, '') ILIKE '%' || e.qa_message_id || '%'
      OR COALESCE(a.inbound_message_id::text, '') = e.qa_message_id
      OR trim(lower(COALESCE(a.latest_user_message::text, ''))) = trim(lower(e.step_text))
    )
  ORDER BY match_rank ASC, a.created_at DESC
  LIMIT 1
)
SELECT
  flow_name,
  decision,
  COALESCE(meta, '{}'::jsonb) AS meta,
  idempotency_key,
  inbound_message_id,
  outbound_message_id,
  latest_user_message,
  created_at
FROM matched
UNION ALL
SELECT
  NULL::text AS flow_name,
  NULL::jsonb AS decision,
  '{}'::jsonb AS meta,
  NULL::text AS idempotency_key,
  NULL::text AS inbound_message_id,
  NULL::text AS outbound_message_id,
  NULL::text AS latest_user_message,
  NULL::timestamptz AS created_at
WHERE NOT EXISTS (SELECT 1 FROM matched)
LIMIT 1;
