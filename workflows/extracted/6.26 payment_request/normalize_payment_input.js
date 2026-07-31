// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
// Nodo:        normalize_payment_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback) {
  if (fallback === undefined) fallback = {};
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch(e) { return fallback; }
}

const triggerData = $("6.26 payment_request").first().json;
const payload = parseMaybeJson(triggerData.payload, triggerData);
const ctx = payload.execution_context || {};
const state = (payload.context_packet && payload.context_packet.state) || {};

function firstVal() {
  for (var i = 0; i < arguments.length; i++) {
    var v = arguments[i];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return null;
}

const lead_id = firstVal(ctx.lead_id, payload.lead_id);
const phone = firstVal(ctx.phone, payload.phone);
const email = firstVal(ctx.email, payload.email, "contacto@aahumada.com");
const latestPrice = ($json.latest_price !== null && $json.latest_price !== undefined) ? Number($json.latest_price) : null;
const computedPrice = ($json.computed_price !== null && $json.computed_price !== undefined) ? Number($json.computed_price) : null;
const service = firstVal(ctx.service_interest, state.service_interest, $json.latest_service, "Servicio de lavado");
const amount = firstVal(ctx.quoted_price, state.quoted_price, latestPrice, computedPrice, ctx.amount, 0);
const booking_date = firstVal(ctx.booking_date, state.booking_date);
const booking_time = firstVal(ctx.booking_time, state.booking_time);
const commerceOrder = "AHD-" + (lead_id || "x").slice(0, 8) + "-" + Date.now();

return [{
  ...payload,
  payment_context: {
    lead_id, phone, email, service,
    amount: Math.round(Number(amount) || 0),
    commerce_order: commerceOrder,
    subject: "Ahumada Detailing - " + service,
    booking_date, booking_time
  }
}];
