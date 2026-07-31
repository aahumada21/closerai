// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        build_state_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $input.first().json;

const originalContext = originalInput.context_packet || {};
const current = $json.context_packet?.state || originalContext.state || {};
const patch =
  $json.sanitized_state_update ||
  $json.state_update ||
  {};

const leadId =
  $json.execution_context?.lead_id ||
  $json.lead_id ||
  $json.context_packet?.lead?.id ||
  originalContext.lead?.id ||
  null;

const phone =
  $json.execution_context?.phone ||
  $json.phone ||
  $json.context_packet?.lead?.phone ||
  originalContext.lead?.phone ||
  null;

const channel =
  $json.execution_context?.channel ||
  $json.channel ||
  $json.context_packet?.lead?.channel ||
  originalContext.lead?.channel ||
  "whatsapp";

if (!leadId) {
  throw new Error("Missing lead_id in build_state_payload");
}

// eliminar solo undefined, no null
const cleanPatch = Object.fromEntries(
  Object.entries(patch).filter(([_, value]) => value !== undefined)
);
if (cleanPatch.confirmed_vehicle_type === undefined && cleanPatch.vehicle_type) {
  cleanPatch.confirmed_vehicle_type = cleanPatch.vehicle_type;
}

if (cleanPatch.confirmed_district === undefined && cleanPatch.district) {
  cleanPatch.confirmed_district = cleanPatch.district;
}

let lead_state_update = {
  ...current,
  ...cleanPatch,
  updated_at: new Date().toISOString()
};

// asegurar que missing_fields sea array internamente
if (!Array.isArray(lead_state_update.missing_fields)) {
  lead_state_update.missing_fields = Array.isArray(current.missing_fields)
    ? current.missing_fields
    : [];
}

return [{
  ...$json,

  lead_id: leadId,
  phone,
  channel,

  context_packet: $json.context_packet || originalContext,

  execution_context: {
    ...($json.execution_context || {}),
    lead_id: leadId,
    phone,
    channel,
    action:
      $json.execution_context?.action ||
      originalInput.decision?.action ||
      null
  },

  lead_state_update
}];
