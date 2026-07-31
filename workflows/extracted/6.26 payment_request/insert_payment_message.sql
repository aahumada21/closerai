-- === ARCHIVO GENERADO -- NO EDITAR ===
-- Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
-- Nodo:        insert_payment_message
--
-- La fuente de verdad es el JSON del workflow en workflows/exports/.
-- Regenerar con: node scripts/extract_workflow_code.js
-- =====================================

INSERT INTO messages (lead_id, direction, content, channel, created_at)
VALUES (
  NULLIF('{{ $("build_payment_message").first().json.execution_context.lead_id }}', '')::uuid,
  'outbound',
  '{{ $("build_payment_message").first().json.message_to_send.replace(/'/g, "''") }}',
  '{{ $("build_payment_message").first().json.channel || "whatsapp" }}',
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id;
