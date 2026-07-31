// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        combine_confirmation_with_pre_service_instructions
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const preServiceResult = $json;
const original = $("build_booking_confirmation_message").first().json;

const confirmMessage = original.message_to_send || original.message || "";
const instructionsMessage = preServiceResult.message_to_send || preServiceResult.message || "";

const combinedMessage = instructionsMessage
  ? `${confirmMessage}\n\n${instructionsMessage}`
  : confirmMessage;

// Explicitly preserve context_packet from original booking context
// (preServiceResult from 6.13 may overwrite it with null/empty)
const preservedContextPacket = original.context_packet || preServiceResult.context_packet;
const paymentPreference = preservedContextPacket?.state?.payment_preference ||
  original.execution_context?.payment_preference || null;

return [
  {
    json: {
      ...original,
      ...preServiceResult,
      message_to_send: combinedMessage,
      message: combinedMessage,
      context_packet: preservedContextPacket,
      payment_preference_direct: paymentPreference
    }
  }
];
