// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.18 recommend_service  (workflow id dd796016-14dd-4845-8d96-84722bcf7bc5)
// Nodo:        build_recommend_service_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = data.context_packet?.state || {};
const conversation = data.context_packet?.conversation || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function serviceLabel(service) {
  const map = {
    lavado_esencial: "lavado de mantencin",
    lavado_profundo: "lavado profundo",
    lavado_premium: "lavado premium"
  };

  return map[service] || service || "servicio";
}

const vehicleType = firstValue(ctx.vehicle_type, state.vehicle_type);
const district = firstValue(ctx.district, state.district);
const latestMessage = firstValue(
  ctx.customer_need,
  conversation.latest_user_message,
  data.decision?.message,
  ""
);

const normalized = normalizeText(latestMessage);

const missingFields = [];

if (!vehicleType) missingFields.push("vehicle_type");
if (!district) missingFields.push("district");

function inferRecommendedService(text) {
  const premiumSignals = [
    "premium",
    "completo",
    "lo mejor",
    "full",
    "detallado",
    "impecable",
    "muy sucio",
    "demasiado sucio",
    "manchado",
    "manchas",
    "olor",
    "mas completo",
    "mas completo",
    "dejarlo como nuevo",
    "vender el auto",
    "regalo",
    "especial"
  ];

  const deepSignals = [
    "profundo",
    "bien limpio",
    "harto tiempo",
    "mucho tiempo",
    "sucio",
    "interior",
    "aspirado",
    "normal pero bueno",
    "algo bueno",
    "terminacion buena",
    "terminacin buena"
  ];

  const basicSignals = [
    "barato",
    "economico",
    "econmico",
    "mantencion",
    "mantencin",
    "rapido",
    "rpido",
    "simple",
    "basico",
    "bsico",
    "por fuera",
    "mantener"
  ];

  if (premiumSignals.some(signal => text.includes(normalizeText(signal)))) {
    return "lavado_premium";
  }

  if (deepSignals.some(signal => text.includes(normalizeText(signal)))) {
    return "lavado_profundo";
  }

  if (basicSignals.some(signal => text.includes(normalizeText(signal)))) {
    return "lavado_esencial";
  }

  return "lavado_profundo";
}

const recommendedService = inferRecommendedService(normalized);

let message = "";

if (missingFields.length > 0) {
  message =
    "S, te puedo recomendar el servicio mas conveniente. Para hacerlo bien, necesito dos datos: que tipo de vehculo tienes y en que comuna seria el servicio.\n\n" +
    "Con eso te digo si te conviene mas el lavado de mantencin, el lavado profundo o el lavado premium.";

  return [{
    ...data,

    message_to_send: message,

    db_operations: ["messages", "lead_state"],

    state_update: {
      ...(data.state_update || {}),

      stage: "service_discovery",
      intent_last: "service_recommendation_requested",
      next_goal: "collect_vehicle_and_district",
      last_bot_action: "recommend_service",

      vehicle_type: vehicleType || null,
      district: district || null,
      missing_fields: missingFields
    },

    execution_context: {
      ...ctx,
      action: "recommend_service"
    },

    execution_result: {
      success: true,
      action: "recommend_service",
      message_sent: false,
      state_updated: true,
      db_records_created: ["messages", "lead_state"],
      notes: ["recommendation_needs_vehicle_or_district"]
    },

    notes: ["recommendation_needs_vehicle_or_district"]
  }];
}

const reasonByService = {
  lavado_esencial:
    "porque sirve bien cuando buscas una limpieza de mantencin, rpida y prctica, sin entrar en una limpieza tan detallada.",

  lavado_profundo:
    "porque es un punto medio muy conveniente: limpia mejor que una mantencin bsica y sirve cuando el auto necesita una limpieza mas completa por dentro y por fuera.",

  lavado_premium:
    "porque es la opcin mas completa, pensada para cuando quieres una terminacin mas cuidada y un resultado mas detallado."
};

message =
  `Para tu ${vehicleType} en ${district}, te recomendara el ${serviceLabel(recommendedService)}, ` +
  `${reasonByService[recommendedService]}\n\n` +
  "Si quieres, ahora puedo darte el valor o revisar los horarios disponibles para agendar.";

return [{
  ...data,

  message_to_send: message,

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...(data.state_update || {}),

    stage: "qualified",
    intent_last: "service_recommendation_requested",
    next_goal: "quote_or_offer_slots",
    last_bot_action: "recommend_service",

    service_interest: recommendedService,
    vehicle_type: vehicleType,
    district: district,

    missing_fields: []
  },

  execution_context: {
    ...ctx,
    action: "recommend_service",
    service_interest: recommendedService,
    vehicle_type: vehicleType,
    district: district
  },

  recommendation: {
    recommended_service: recommendedService,
    vehicle_type: vehicleType,
    district: district,
    source: "rule_based_recommendation"
  },

  execution_result: {
    success: true,
    action: "recommend_service",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: ["service_recommendation_sent"]
  },

  notes: ["service_recommendation_sent"]
}];
