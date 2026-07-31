// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.8 send_quote  (workflow id 48860882-12ae-40c1-be93-c9778cade549)
// Nodo:        build_pricing_unavailable_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function serviceLabel(service) {
  const map = {
    lavado_basico: "lavado basico",
    lavado_premium: "lavado premium",
    encerado_full: "encerado full",
    lavado_profundo: "lavado premium",
    lavado_esencial: "lavado basico"
  };

  return map[service] || service || "ese servicio";
}

const vehicle =
  $json.normalized_inputs?.vehicle_type ||
  $json.quote?.vehicle_type ||
  $json.execution_context?.vehicle_type ||
  $json.context_packet?.state?.vehicle_type ||
  null;

const service =
  $json.quote?.service ||
  $json.execution_context?.service_interest ||
  $json.context_packet?.state?.service_interest ||
  null;

const message = vehicle
  ? `No tengo una tarifa definida para ${serviceLabel(service)} en ${vehicle}. Te derivare con un asesor para confirmar el precio antes de agendar.`
  : "No pude calcular la cotizacion en este momento. Te derivare con un asesor para revisar precio y horarios antes de agendar.";

return [{
  ...$json,
  message_to_send: message,
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "human_handoff",
    human_handoff: true,
    last_bot_action: "pricing_rule_not_found",
    next_goal: "manual_pricing_review"
  },
  notes: [
    ...($json.notes || []),
    "pricing_rule_not_found",
    "handoff_required_after_quote_failure"
  ]
}];
