// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        normalize_final_state_update
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $input.first().json;

const contextPacket =
  $json.context_packet ||
  originalInput.context_packet ||
  {};

const currentState = contextPacket.state || {};

const action =
  $json.execution_context?.action ||
  $json.decision?.action ||
  $json.action ||
  null;

const proposedStateUpdate =
  $json.state_update ||
  $json.execution_context?.state_update ||
  $json.decision?.state_update ||
  {};

function isEmpty(value) {
  if (value === undefined) return true;
  if (value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

function cleanPatch(obj) {
  const out = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (isEmpty(value)) continue;
    out[key] = value;
  }

  return out;
}

let sanitized = cleanPatch(proposedStateUpdate);

const defaultsByAction = {
  ask_missing_data: {
    last_bot_action: "ask_missing_data",
    next_goal: sanitized.next_goal || "collect_missing_data",
  },

  send_quote: {
    stage: "quoted",
    last_bot_action: "send_quote",
    next_goal: "book_appointment",
    missing_fields: [],
  },

  answer_question: {
    last_bot_action: "answer_question",
  },

  answer_objection: {
    stage: "closing",
    intent_last: "objection_answered",
    next_goal: "book_appointment",
    last_bot_action: "answer_objection",
    missing_fields: [],
  },

  offer_booking: {
    stage: "closing",
    next_goal: "book_appointment",
    last_bot_action: "offer_booking",
  },

  offer_available_slots: {
    stage: "booking_selection",
    next_goal: "collect_selected_slot",
    last_bot_action: "offer_available_slots",
    availability_confirmed: false,
  },

  collect_address: {
    stage: "collecting_address",
    next_goal: "collect_address",
    last_bot_action: "collect_address",
    missing_fields: ["address"],
  },

  confirm_address: {
    stage: "address_confirmation",
    next_goal: "confirm_booking",
    last_bot_action: "confirm_address",
    missing_fields: [],
  },

  confirm_booking: {
    stage: "booked",
    next_goal: "send_pre_service_instructions",
    last_bot_action: "confirm_booking",
    availability_confirmed: true,
    missing_fields: [],
  },

  cancel_booking: {
    last_bot_action: sanitized.last_bot_action || "cancel_booking",
    missing_fields: [],
  },

  reschedule_booking: {
    stage: "reschedule",
    next_goal: "collect_new_slot",
    last_bot_action: "reschedule_booking",
    missing_fields: [],
  },

  handoff_human: {
    stage: "human_handoff",
    human_handoff: true,
    next_goal: "human_takeover",
    last_bot_action: "handoff_human",
    missing_fields: [],
  },

  request_review: {
    stage: "post_service",
    next_goal: "request_customer_review",
    last_bot_action: "request_review",
    missing_fields: [],
  },

  request_referral: {
    stage: "post_service",
    next_goal: "facilitate_referral",
    last_bot_action: "request_referral",
    missing_fields: [],
  },

  send_service_menu: {
    stage: "service_discovery",
    next_goal: "collect_vehicle_and_district",
    last_bot_action: "send_service_menu",
    missing_fields: [],
  },

  recommend_service: {
    stage: "service_discovery",
    next_goal: "collect_vehicle_and_district",
    last_bot_action: "recommend_service",
  },
};

sanitized = {
  ...(defaultsByAction[action] || {}),
  ...sanitized,
};

if (!Array.isArray(sanitized.missing_fields)) {
  sanitized.missing_fields = Array.isArray(currentState.missing_fields)
    ? currentState.missing_fields
    : [];
}

if (sanitized.human_handoff === undefined || sanitized.human_handoff === null) {
  sanitized.human_handoff = currentState.human_handoff === true;
}
function canonicalVehicle(value) {
  const t = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .trim();

  const map = {
    "suv": "SUV",
    "jeep": "SUV",
    "4x4": "SUV",
    "camioneta": "Camioneta",
    "pickup": "Camioneta",
    "pick up": "Camioneta",
    "sedan": "Sedan",
    "hatchback": "Hatchback",
    "city car": "City car",
    "citycar": "City car",
    "auto": "Auto",
    "automovil": "Auto",
    "vehiculo": "Auto",
    "moto": "Moto",
    "motocicleta": "Moto",
    "furgon": "Furgon",
    "van": "Furgon",
  };

  return map[t] || null;
}

function canonicalDistrict(value) {
  const t = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const map = {
    "huechuraba": "Huechuraba",
    "vitacura": "Vitacura",
    "las condes": "Las Condes",
    "providencia": "Providencia",
    "lo barnechea": "Lo Barnechea",
    "santiago centro": "Santiago Centro",
    "santiago": "Santiago",
    "nunoa": "Nunoa",
    "independencia": "Independencia",
    "recoleta": "Recoleta",
    "quilicura": "Quilicura",
    "conchali": "Conchali",
    "colina": "Colina",
    "la reina": "La Reina",
    "penalolen": "Penalolen",
    "macul": "Macul",
    "la florida": "La Florida",
    "maipu": "Maipu",
    "san miguel": "San Miguel",
    "la cisterna": "La Cisterna",
    "puente alto": "Puente Alto",
    "pudahuel": "Pudahuel",
    "renca": "Renca",
  };

  return map[t] || null;
}

if (sanitized.mentioned_vehicle_type) {
  sanitized.mentioned_vehicle_type =
    canonicalVehicle(sanitized.mentioned_vehicle_type) || sanitized.mentioned_vehicle_type;
}

if (sanitized.confirmed_vehicle_type) {
  sanitized.confirmed_vehicle_type =
    canonicalVehicle(sanitized.confirmed_vehicle_type) || sanitized.confirmed_vehicle_type;

  // compatibilidad con el sistema actual
  sanitized.vehicle_type = sanitized.confirmed_vehicle_type;
}

if (sanitized.vehicle_type) {
  const normalizedVehicle = canonicalVehicle(sanitized.vehicle_type);
  sanitized.vehicle_type = normalizedVehicle || sanitized.vehicle_type;
  sanitized.confirmed_vehicle_type = sanitized.confirmed_vehicle_type || sanitized.vehicle_type;
}

if (sanitized.mentioned_district) {
  sanitized.mentioned_district =
    canonicalDistrict(sanitized.mentioned_district) || sanitized.mentioned_district;
}

if (sanitized.confirmed_district) {
  sanitized.confirmed_district =
    canonicalDistrict(sanitized.confirmed_district) || sanitized.confirmed_district;

  // compatibilidad con el sistema actual
  sanitized.district = sanitized.confirmed_district;
}

if (sanitized.district) {
  const normalizedDistrict = canonicalDistrict(sanitized.district);
  sanitized.district = normalizedDistrict || sanitized.district;
  sanitized.confirmed_district = sanitized.confirmed_district || sanitized.district;
}

return [
  {
    ...$json,

    proposed_state_update: proposedStateUpdate,
    sanitized_state_update: sanitized,

    // Desde aqui en adelante este es el unico state_update oficial.
    state_update: sanitized,

    meta: {
      ...($json.meta || {}),
      state_resolution: {
        source: "normalize_final_state_update",
        action,
        state_before: currentState,
        proposed_state_update: proposedStateUpdate,
        sanitized_state_update: sanitized,
      },
    },
  },
];
