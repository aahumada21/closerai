-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
-- Nodo:        insert_hold_reminder_message
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO messages (lead_id, direction, content, channel, created_at)
VALUES (
  NULLIF('{{ $("find_holds_needing_reminder").item.json.lead_id }}', '')::uuid,
  'outbound',
  '{{ $("build_hold_reminder_message").item.json.message.replace(/'/g, "''") }}',
  '{{ $("build_hold_reminder_message").item.json.channel || "whatsapp" }}',
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id;
