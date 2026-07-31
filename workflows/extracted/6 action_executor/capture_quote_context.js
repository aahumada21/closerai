// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        capture_quote_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const quoteMessage = (() => {
  try {
    return $("build_quote_message").first().json;
  } catch {
    return {};
  }
})();

const insertedQuote = (() => {
  try {
    return $("inser_quote").first().json;
  } catch {
    return {};
  }
})();

const current = $json || {};

const quoteDbId =
  insertedQuote.id ||
  current.id ||
  quoteMessage.quote_db_id ||
  null;

const messageToSend =
  quoteMessage.message_to_send ||
  quoteMessage.message ||
  current.message_to_send ||
  current.message ||
  null;

if (!messageToSend) {
  throw new Error("send_quote lost message_to_send before IF requires_message");
}

const executionContext = {
  ...(quoteMessage.execution_context || {}),
  ...(current.execution_context || {})
};

const contextPacket =
  quoteMessage.context_packet ||
  current.context_packet ||
  {};

const decision =
  quoteMessage.decision ||
  current.decision ||
  null;

const serviceInterest =
  quoteMessage.state_update?.service_interest ||
  executionContext.service_interest ||
  contextPacket.state?.service_interest ||
  null;

const vehicleType =
  quoteMessage.state_update?.vehicle_type ||
  executionContext.vehicle_type ||
  contextPacket.state?.vehicle_type ||
  null;

const district =
  quoteMessage.state_update?.district ||
  executionContext.district ||
  contextPacket.state?.district ||
  null;

return [
  {
    ...quoteMessage,
    ...current,

    quote_db_id: quoteDbId,

    message_to_send: messageToSend,
    message: messageToSend,

    db_operations: ["messages", "offers_or_quotes", "lead_state"],

    execution_context: {
      ...executionContext,
      action: "send_quote",
      service_interest: serviceInterest,
      vehicle_type: vehicleType,
      district
    },

    context_packet: contextPacket,
    decision,

    state_update: {
      ...(quoteMessage.state_update || {}),
      ...(current.state_update || {}),

      stage: "quoted",
      intent_last: "quote_sent",
      next_goal: "book_appointment",
      last_bot_action: "send_quote",

      service_interest: serviceInterest,
      vehicle_type: vehicleType,
      district,

      missing_fields: []
    },

    internal_status: "send_quote_ready_to_send",

    notes: [
      ...(quoteMessage.notes || []),
      ...(current.notes || []),
      "quote_context_restored_before_message_send"
    ]
  }
];
