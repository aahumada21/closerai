// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_error_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $json.original || $json;

const decision =
  original.decision ||
  original.original?.decision ||
  null;

const contextPacket =
  original.context_packet ||
  original.original?.context_packet ||
  {};

const leadId =
  original.execution_context?.lead_id ||
  contextPacket.lead?.id ||
  original.lead?.id ||
  null;

const channel =
  original.execution_context?.channel ||
  contextPacket.lead?.channel ||
  original.event?.channel ||
  "whatsapp";

const action =
  original.execution_context?.action ||
  decision?.action ||
  null;

const inboundMessageId =
  original.execution_context?.inbound_message_id ||
  contextPacket.conversation?.last_message_id ||
  original.event?.message_id ||
  null;

const idempotencyKey =
  original.execution_context?.idempotency_key ||
  (
    leadId && inboundMessageId && action
      ? `${leadId}__${inboundMessageId}__${action}`
      : null
  );

return [
  {
    json: {
      ...original,

      error: true,
      errors: $json.errors || original.errors || ["validation error"],

      decision,
      context_packet: contextPacket,

      lead_id: leadId,
      channel,
      idempotency_key: idempotencyKey,

      execution_context: {
        ...(original.execution_context || {}),
        lead_id: leadId,
        channel,
        action,
        inbound_message_id: inboundMessageId,
        idempotency_key: idempotencyKey
      },

      message_sent: false,
      outbound_message_saved: false,
      state_updated: false,

      execution_result: {
        success: false,
        action,
        message_sent: false,
        state_updated: false,
        db_records_created: [],
        notes: $json.errors || original.errors || ["validation error"]
      },

      notes: [
        ...(original.notes || []),
        "action_executor_validation_error"
      ]
    }
  }
];
