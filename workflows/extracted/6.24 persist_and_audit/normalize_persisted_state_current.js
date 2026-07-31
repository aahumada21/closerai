// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        normalize_persisted_state_current
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function boolValue(value) {
  if (value === true) return true;
  if (value === false) return false;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return false;
}

const persistedState = {
  lead_id: $json.lead_id || null,

  stage: $json.stage || null,
  intent_last: $json.intent_last || null,
  interest_score: $json.interest_score ?? null,

  service_interest: $json.service_interest || null,
  vehicle_type: $json.vehicle_type || null,
  district: $json.district || null,

  missing_fields: parseJsonArray($json.missing_fields),
  last_bot_action: $json.last_bot_action || null,
  next_goal: $json.next_goal || null,
  human_handoff: boolValue($json.human_handoff),

  booking_options: parseJsonArray($json.booking_options),
  booking_date: $json.booking_date || null,
  booking_time: $json.booking_time || null,
  slot_id: $json.slot_id || null,
  availability_confirmed: boolValue($json.availability_confirmed),

  availability_window: $json.availability_window || null,
  availability_label: $json.availability_label || null,
  calendar_id: $json.calendar_id || null,
  duration_minutes: $json.duration_minutes ?? null,
  days_ahead: $json.days_ahead ?? null,
  start_offset_days: $json.start_offset_days ?? null,
  max_slots: $json.max_slots ?? null,

  service_address: $json.service_address || null,
  address_reference: $json.address_reference || null,
  address_confirmed: boolValue($json.address_confirmed),
  address_confirmed_at: $json.address_confirmed_at || null,

  cancellation_reason: $json.cancellation_reason || null,
  last_appointment_event_id: $json.last_appointment_event_id || null,

  updated_at: $json.updated_at || null,
};

return [{
  ...$json,
  state_updated: !!persistedState.updated_at,
  persisted_state_current: persistedState,
  state: {
    current: persistedState,
  }
}];
