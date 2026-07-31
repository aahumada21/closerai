// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.27 payment_confirmed_webhook  (workflow id qogNrpBx2qu6LwYF)
// Nodo:        build_post_payment_msg
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $json;
const ctx = d.execution_context || {};
const bookingMsg = d.message_to_send || d.message || ctx.message || "Tu reserva fue confirmada!";
const originalMsg = ctx.original_payment_message || "";
const finalMsg = originalMsg ? "Pago recibido!\n\n" + bookingMsg : bookingMsg;
return [{
  ...d,
  execution_context: {
    ...ctx,
    message: finalMsg,
    action: "confirm_booking_after_payment",
    state_update: {
      ...(d.state_update || ctx.state_update || {}),
      payment_status: "paid",
      pending_booking_data: null,
      last_bot_action: "booking_confirmed_after_payment"
    }
  },
  db_operations: ["messages", "lead_state"]
}];
