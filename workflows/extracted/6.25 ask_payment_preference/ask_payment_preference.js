// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.25 ask_payment_preference  (workflow id Ffnu4AoqCDEnxNJp)
// Nodo:        ask_payment_preference
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = (data.context_packet && data.context_packet.state) || {};
const service = ctx.service_interest || state.service_interest || "el servicio";
const price = ctx.quoted_price || state.quoted_price || null;
const priceText = price ? " — $" + Number(price).toLocaleString("es-CL") + " CLP" : "";
const msg = "Como preferes pagar" + priceText + "?\n\n- *Ahora con link Flow* — te mando un link seguro para pagar en linea\n- *Al terminar* — pagas en efectivo o transferencia cuando finalice el servicio\n\nCual prefieres?";
return [{
  ...data,
  message_to_send: msg,
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...((data.execution_context && data.execution_context.state_update) || {}),
    last_bot_action: "ask_payment_preference",
    next_goal: "collect_payment_preference",
    intent_last: "payment_preference_asked",
    missing_fields: []
  }
}];
