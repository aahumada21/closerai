// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
// Nodo:        build_payment_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const flowResp = $json;
const prevData = $("build_flow_signature").first().json;
const ctx = prevData.execution_context || {};
const pCtx = prevData.payment_context || {};
const flowUrl = flowResp.url || "";
const flowToken = flowResp.token || "";
const flowOrderId = String(flowResp.flowOrder || "");
const paymentUrl = flowUrl + "?token=" + flowToken;
const amount = pCtx.amount || prevData.amount || ctx.quoted_price || 0;
const service = pCtx.service || prevData.service || ctx.service_interest || "servicio";
const dateText = (ctx.booking_date && ctx.booking_time)
  ? "\nFecha: " + ctx.booking_date + " a las " + ctx.booking_time
  : "";

const isPrepagoreRequired = prevData.payment_for_mode === "prepago_required" ||
  ctx.payment_mode === "prepago_required" ||
  (prevData.context_packet && prevData.context_packet.state && prevData.context_packet.state.payment_mode === "prepago_required");

let msg;
if (isPrepagoreRequired) {
  msg = "Para confirmar tu turno" + dateText + ", necesito que pagues primero.\n\nLink de pago: " + paymentUrl +
    "\nMonto: $" + Number(amount).toLocaleString("es-CL") + " CLP\nServicio: " + service +
    "\n\nEn cuanto confirmes el pago, te reservo el turno en el calendario!";
} else {
  msg = "Perfecto! Aqui tienes el link para pagar:\n\n" + paymentUrl +
    "\n\nMonto: $" + Number(amount).toLocaleString("es-CL") + " CLP\nServicio: " + service + dateText +
    "\n\nUna vez que confirmes el pago, tu cita queda asegurada!";
}

const payloadObj = {
  ...prevData,
  token: flowToken,
  url: flowUrl,
  flowOrder: flowResp.flowOrder,
  channel: ctx.channel || "whatsapp",
  phone: ctx.phone || "",
  message: msg,
  payment_url: paymentUrl,
  flow_order_id: flowOrderId,
  message_to_send: msg,
  execution_context: Object.assign({}, ctx, {
    action: "payment_link_sent",
    message: msg,
    state_update: {
      payment_preference: "prepago",
      payment_status: "pending",
      flow_order_id: flowOrderId,
      flow_payment_url: paymentUrl,
      last_bot_action: isPrepagoreRequired ? "payment_link_pending_booking" : "payment_link_sent"
    }
  }),
  db_operations: ["messages", "lead_state"]
};
return [{ ...payloadObj, payload: JSON.stringify(payloadObj) }];
