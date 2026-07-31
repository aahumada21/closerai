-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
-- Nodo:        DB_Insert_Message
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO messages (
  lead_id,
  direction,
  channel,
  message_type,
  content,
  provider_message_id,
  provider_status,
  status,
  created_at
)
VALUES (
  '{{ $("IF_Send_Success").first().json.lead_id }}',
  'outbound',
  'whatsapp',
  '{{ $("IF_Send_Success").first().json.message_type || "followup" }}',
  '{{ (($("IF_Send_Success").first().json.outbound_message || $("IF_Send_Success").first().json.message || "")).replace(/'/g, "''") }}',
  '{{ $("IF_Send_Success").first().json.provider_message_id || "" }}',
  '{{ $("IF_Send_Success").first().json.provider_status || "" }}',
  'sent',
  NOW()
)
RETURNING id;
