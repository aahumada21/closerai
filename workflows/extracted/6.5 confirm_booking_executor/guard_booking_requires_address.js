// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        guard_booking_requires_address
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const state = data.context_packet?.state || {};

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return null;
}

const serviceAddress = firstText(
  ctx.service_address,
  ctx.address,
  data.booking_request?.service_address,
  data.state_update?.service_address,
  state.service_address,
  state.address
);

const addressReference = firstText(
  ctx.address_reference,
  data.booking_request?.address_reference,
  data.state_update?.address_reference,
  state.address_reference
);

const addressConfirmed =
  ctx.address_confirmed === true ||
  data.booking_request?.address_confirmed === true ||
  data.state_update?.address_confirmed === true ||
  state.address_confirmed === true;

let addressGuardRoute = "continue_booking";
const notes = [...(data.notes || [])];

let stateUpdate = {
  ...(data.state_update || {}),
  ...(ctx.state_update || {})
};

if (!serviceAddress) {
  addressGuardRoute = "collect_address";

  stateUpdate = {
    ...stateUpdate,
    stage: "collecting_address",
    next_goal: "collect_address",
    last_bot_action: "collect_address",
    missing_fields: ["service_address"]
  };

  notes.push("booking_blocked_missing_service_address");
} else if (!addressConfirmed) {
  addressGuardRoute = "confirm_address";

  stateUpdate = {
    ...stateUpdate,
    stage: "address_confirmation",
    next_goal: "confirm_address",
    last_bot_action: "confirm_address_in_progress",
    service_address: serviceAddress,
    address_reference: addressReference,
    address_confirmed: false,
    missing_fields: []
  };

  notes.push("booking_blocked_address_not_confirmed");
} else {
  stateUpdate = {
    ...stateUpdate,
    service_address: serviceAddress,
    address_reference: addressReference,
    address_confirmed: true,
    missing_fields: []
  };

  notes.push("address_guard_passed");
}

return [{
  ...data,

  address_guard_route: addressGuardRoute,

  execution_context: {
    ...ctx,
    service_address: serviceAddress,
    address: serviceAddress,
    address_reference: addressReference,
    address_confirmed: addressConfirmed,
    state_update: stateUpdate
  },

  booking_request: {
    ...(data.booking_request || {}),
    service_address: serviceAddress,
    address_reference: addressReference,
    address_confirmed: addressConfirmed
  },

  state_update: stateUpdate,
  notes
}];
