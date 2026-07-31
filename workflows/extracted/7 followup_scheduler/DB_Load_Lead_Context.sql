-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Load_Lead_Context
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

SELECT
  f.id AS followup_id,
  f.lead_id,
  f.scheduled_for,
  f.status AS followup_status,
  f.created_at AS followup_created_at,
  f.followup_type,
  f.message_template_key,
  COALESCE(f.metadata, '{}'::jsonb) AS metadata,

  l.id AS lead_db_id,
  l.phone,
  l.name,
  false AS opt_out,

  ls.stage,
  ls.intent_last,
  ls.next_goal,
  COALESCE(ls.human_handoff, false) AS human_handoff,
  ls.updated_at AS state_updated_at,

  a.id AS appointment_id,
  a.event_id AS appointment_event_id,
  a.status AS appointment_status,
  a.start_at AS appointment_start_at,
  a.end_at AS appointment_end_at,

  (
    SELECT MAX(m.created_at)
    FROM messages m
    WHERE m.lead_id = f.lead_id
      AND m.direction = 'inbound'
  ) AS last_inbound_at,

  (
    SELECT MAX(m.created_at)
    FROM messages m
    WHERE m.lead_id = f.lead_id
      AND m.direction = 'outbound'
  ) AS last_outbound_at,

  (
    SELECT m.content
    FROM messages m
    WHERE m.lead_id = f.lead_id
      AND m.direction = 'outbound'
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_outbound_text

FROM followups f

JOIN leads l
  ON l.id = f.lead_id

LEFT JOIN lead_state ls
  ON ls.lead_id = f.lead_id

LEFT JOIN LATERAL (
  SELECT
    ap.id,
    ap.event_id,
    ap.conversation_id,
    ap.start_at,
    ap.end_at,
    ap.status
  FROM appointments ap
  WHERE ap.conversation_id = f.lead_id
    AND ap.status IN ('confirmed', 'booked', 'completed')
    AND (
      ap.event_id = f.metadata->>'appointment_event_id'
      OR f.metadata->>'appointment_event_id' IS NULL
    )
  ORDER BY ap.start_at ASC
  LIMIT 1
) a ON true

WHERE f.id = '{{ $json.followup_id }}'
LIMIT 1;
