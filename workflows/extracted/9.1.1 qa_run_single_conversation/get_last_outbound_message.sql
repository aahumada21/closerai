-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
-- Nodo:        get_last_outbound_message
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
matched_audit AS (
  SELECT
    a.outbound_message_id::text AS outbound_message_id,
    CASE
      WHEN COALESCE(a.idempotency_key::text, '') ILIKE '%' || e.qa_message_id || '%' THEN 0
      WHEN COALESCE(a.inbound_message_id::text, '') = e.qa_message_id THEN 1
      ELSE 2
    END AS match_rank,
    a.created_at
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
),
matched_message AS (
  SELECT
    m.id::text AS id,
    m.content::text AS content,
    m.status::text AS status,
    m.provider_status::text AS provider_status,
    m.created_at AS created_at
  FROM public.messages m
  WHERE m.id::text = (SELECT outbound_message_id FROM matched_audit)
    AND m.direction = 'outbound'
    AND COALESCE(TRIM(m.content), '') <> ''
    AND LOWER(COALESCE(m.content, '')) NOT IN ('workflow was started', 'workflow started')
  ORDER BY m.created_at DESC
  LIMIT 1
)
SELECT id, content, status, provider_status, created_at
FROM matched_message
UNION ALL
SELECT
  NULL::text AS id,
  NULL::text AS content,
  NULL::text AS status,
  NULL::text AS provider_status,
  NULL::timestamptz AS created_at
WHERE NOT EXISTS (SELECT 1 FROM matched_message)
LIMIT 1;
