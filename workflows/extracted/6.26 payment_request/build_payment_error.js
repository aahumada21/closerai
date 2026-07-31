// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
// Nodo:        build_payment_error
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const prevData = $("build_flow_signature").first().json;
const ctx = prevData.execution_context || prevData.payment_context || {};
const msg = "Hubo un problema al generar el link de pago. Contactame directamente para coordinar el pago.";

const payloadObj = {
  ...prevData,
  channel: ctx.channel || "whatsapp",
  phone: ctx.phone || "",
  message: msg,
  message_to_send: msg,
  payment_request_status: "error",
  execution_context: Object.assign({}, ctx, {
    action: "payment_link_error",
    message: msg
  })
};
return [{ ...payloadObj, payload: JSON.stringify(payloadObj) }];
