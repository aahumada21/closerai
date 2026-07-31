// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.8 send_quote  (workflow id 48860882-12ae-40c1-be93-c9778cade549)
// Nodo:        build_quote_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function formatCLP(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `$${value}`;
  }

  return `$${number.toLocaleString("es-CL")}`;
}

function serviceLabel(service) {
  const map = {
    lavado_basico: "lavado basico",
    lavado_premium: "lavado premium",
    encerado_full: "encerado full",
    lavado_profundo: "lavado premium",
    lavado_esencial: "lavado basico"
  };

  return map[service] || service || "servicio";
}

const vehicle =
  $json.normalized_inputs?.vehicle_type ||
  $json.quote?.vehicle_type ||
  $json.execution_context?.vehicle_type ||
  $json.context_packet?.state?.vehicle_type ||
  "tu vehiculo";

const district =
  $json.normalized_inputs?.district_key ||
  $json.quote?.district ||
  $json.execution_context?.district ||
  $json.context_packet?.state?.district ||
  "tu comuna";

if (Array.isArray($json.price_list) && $json.price_list.length > 0) {
  const lines = $json.price_list.map((item) =>
    `- ${serviceLabel(item.service_code)}: ${formatCLP(item.price)}`
  );

  const message =
    `Perfecto. Para tu ${vehicle} en ${district}, estos son los valores:\n\n` +
    lines.join("\n") +
    "\n\nSi quieres, te puedo mandar horarios para agendar el servicio que prefieras.";

  return [{
    ...$json,
    message_to_send: message,
    db_operations: ["messages", "offers_or_quotes"],
    state_update: {
      ...($json.state_update || {}),
      stage: "quoted",
      intent_last: "price_list_sent",
      next_goal: "choose_service_or_book",
      last_bot_action: "send_quote",
      vehicle_type: vehicle,
      district: district,
      missing_fields: []
    },
    internal_status: "send_quote_in_progress"
  }];
}

const q = $json.quote;

if (!q || !q.price) {
  throw new Error("Missing resolved quote");
}

const service =
  q.service ||
  $json.execution_context?.service_interest ||
  $json.context_packet?.state?.service_interest ||
  null;

const message = `Perfecto. Para tu ${vehicle} en ${district}, el ${serviceLabel(service)} tiene un valor de ${formatCLP(q.price)}. Quieres que te mande los horarios para agendar?`;

return [{
  ...$json,
  message_to_send: message,
  db_operations: ["messages", "offers_or_quotes"],
  state_update: {
    ...($json.state_update || {}),
    stage: "quoted",
    intent_last: "quote_sent",
    next_goal: "book_appointment",
    last_bot_action: "send_quote",
    service_interest: service,
    vehicle_type: vehicle,
    district: district,
    missing_fields: [],
    quoted_price: q.price || null,
    quoted_service: service || null
  },
  internal_status: "send_quote_in_progress"
}];
