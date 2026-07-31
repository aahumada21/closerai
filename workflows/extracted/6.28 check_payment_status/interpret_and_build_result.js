// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.28 check_payment_status  (workflow id bRPFQVB8uOwaTUyp)
// Nodo:        interpret_and_build_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const statusResp = $json;
const prevData = $("build_status_check_signature").first().json;
const ctx = prevData.execution_context || {};
const leadId = ctx.lead_id || (prevData.context_packet && prevData.context_packet.state && prevData.context_packet.state.lead_id) || "";
const phone = ctx.phone || "";
const channel = ctx.channel || "whatsapp";

const flowStatus = Number(statusResp.status);
const localPaymentStatus = prevData.local_payment_status || "";
const paymentUrl = prevData.flow_payment_url || "";

let message = "";
let needsSelfHeal = false;

if (!prevData.flow_order_id) {
  message = "No tengo ningun pago pendiente registrado a tu nombre.";
} else if (flowStatus === 2) {
  if (localPaymentStatus !== "paid") {
    needsSelfHeal = true;
    message = "";
  } else {
    message = "Si, confirmado! Tu pago ya esta registrado. Nos vemos en la fecha acordada.";
  }
} else if (flowStatus === 1) {
  message = "Todavia no se ha registrado tu pago en Flow. Si ya pagaste, puede tardar unos minutos en reflejarse. Si no, aqui tienes el link de nuevo:" +
    (paymentUrl ? ("\n" + paymentUrl) : "");
} else if (flowStatus === 3) {
  message = "Tu pago fue rechazado por Flow. Si quieres, te genero un nuevo link para intentar de nuevo.";
} else if (flowStatus === 4) {
  message = "Ese link de pago fue anulado. Avisame si quieres que te genere uno nuevo.";
} else {
  message = "No pude verificar el estado de tu pago en este momento. Intenta de nuevo en un momento.";
}

return [{
  channel,
  phone,
  message,
  execution_context: {
    lead_id: leadId,
    phone,
    channel,
    message,
    state_update: { last_bot_action: "check_payment_status" }
  },
  message_to_send: message,
  flow_order_id: prevData.flow_order_id,
  flow_payment_url: paymentUrl,
  needs_self_heal: needsSelfHeal,
  db_operations: ["lead_state"]
}];
