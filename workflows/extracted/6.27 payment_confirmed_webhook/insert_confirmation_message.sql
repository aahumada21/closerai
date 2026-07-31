-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
-- Nodo:        insert_confirmation_message
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO messages (lead_id, direction, content, channel, created_at)
VALUES (
  NULLIF('{{ $("build_confirmation_msg").first().json.execution_context.lead_id }}', '')::uuid,
  'outbound',
  '{{ $("build_confirmation_msg").first().json.message_to_send.replace(/'/g, "''") }}',
  '{{ $("build_confirmation_msg").first().json.channel || "whatsapp" }}',
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id;
