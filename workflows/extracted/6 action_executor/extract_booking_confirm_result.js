// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        extract_booking_confirm_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

// 6.5 returns items from parallel terminal nodes (booking result + DB followup records).
// Find the item with execution_result (the actual booking confirmation result).
const allItems = $input.all();
if (!allItems || allItems.length === 0) {
  return [{ json: { payment_preference_direct: '' } }];
}

const bookingResult = allItems.find(i => i.json && i.json.execution_result != null) || allItems[0];

// Collect payment_preference from all items
let paymentPref = '';
for (const item of allItems) {
  if (!item.json) continue;
  const j = item.json;
  const pref =
    j.payment_preference_direct ||
    (j.context_packet && j.context_packet.state && j.context_packet.state.payment_preference) ||
    (j.execution_context && j.execution_context.payment_preference) ||
    (j.state_update && j.state_update.payment_preference) ||
    '';
  if (pref) { paymentPref = pref; break; }
}

// Also check bookingResult specifically (redundant but explicit)
if (!paymentPref && bookingResult && bookingResult.json) {
  const j = bookingResult.json;
  paymentPref =
    j.payment_preference_direct ||
    (j.context_packet && j.context_packet.state && j.context_packet.state.payment_preference) ||
    (j.execution_context && j.execution_context.payment_preference) ||
    '';
}

// Fallback: if no explicit payment_preference was ever captured upstream,
// derive it from payment_mode so auto-select business configs (prepago_only,
// prepago_required, postpago_only) still trigger the right downstream branch.
if (!paymentPref) {
  let paymentMode = '';
  for (const item of allItems) {
    if (!item.json) continue;
    const j = item.json;
    const mode =
      (j.context_packet && j.context_packet.state && j.context_packet.state.payment_mode) ||
      (j.context_packet && j.context_packet.agent_business_config && j.context_packet.agent_business_config.config && j.context_packet.agent_business_config.config.payment_mode) ||
      (j.execution_context && j.execution_context.payment_mode) ||
      '';
    if (mode) { paymentMode = mode; break; }
  }
  if (paymentMode === 'prepago_only' || paymentMode === 'prepago_required') {
    paymentPref = 'prepago';
  } else if (paymentMode === 'postpago_only') {
    paymentPref = 'postpago';
  }
  // paymentMode === 'both' (or unknown): leave paymentPref empty, an explicit
  // choice is genuinely required in that mode.
}

const resultJson = bookingResult && bookingResult.json ? bookingResult.json : {};
return [{ json: { ...resultJson, payment_preference_direct: paymentPref } }];
