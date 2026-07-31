// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        build_update_lead_state_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const s = $json.lead_state_update || {};
const leadId = $json.lead_id || $json.execution_context?.lead_id;

if (!leadId) {
  throw new Error("Missing lead_id in build_update_lead_state_query");
}

// COALESCE no sirve para "borrar": trata null como "no tocar" y mantiene
// el valor viejo en la columna (eso causaba que un "ok"/"si" suelto
// reactivara una reserva ya cancelada, o que slots viejos sobrevivieran
// a un reschedule). Cualquier regla/sub-workflow que necesite borrar una
// columna de verdad debe declararlo explicitamente en
// lead_state_update.fields_to_clear, en vez de depender de adivinar por
// el nombre de la action.
const fieldsToClear = Array.isArray(s.fields_to_clear) ? s.fields_to_clear : [];

function shouldForceClear(column) {
  return fieldsToClear.includes(column);
}

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "NULL";
}

function sqlBool(value) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (String(value).toLowerCase() === "true") return "true";
  if (String(value).toLowerCase() === "false") return "false";
  return "NULL";
}

function sqlJsonbOrNull(value) {
  if (!Array.isArray(value)) return "NULL";
  const json = JSON.stringify(value);
  return "'" + json.replace(/'/g, "''") + "'::jsonb";
}

function sqlUuidOrNull(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  return isUuid ? "'" + text + "'::uuid" : "NULL::uuid";
}

function keepText(column, value) {
  if (shouldForceClear(column)) return column + " = " + sqlText(value);
  return column + " = COALESCE(" + sqlText(value) + ", " + column + ")";
}

function keepNumber(column, value) {
  if (shouldForceClear(column)) return column + " = " + sqlNumber(value);
  return column + " = COALESCE(" + sqlNumber(value) + ", " + column + ")";
}

function keepBool(column, value) {
  if (shouldForceClear(column)) return column + " = " + sqlBool(value);
  return column + " = COALESCE(" + sqlBool(value) + ", " + column + ")";
}

function keepJsonb(column, value) {
  if (shouldForceClear(column)) {
    const forced = sqlJsonbOrNull(value);
    return column + " = " + (forced === "NULL" ? "'[]'::jsonb" : forced);
  }
  return column + " = COALESCE(" + sqlJsonbOrNull(value) + ", " + column + ")";
}

function keepUuid(column, value) {
  if (shouldForceClear(column)) return column + " = " + sqlUuidOrNull(value);
  return column + " = COALESCE(" + sqlUuidOrNull(value) + ", " + column + ")";
}

const query = `
UPDATE public.lead_state
SET
  ${keepText("stage", s.stage)},
  ${keepText("intent_last", s.intent_last)},
  ${keepNumber("interest_score", s.interest_score)},

  ${keepText("service_interest", s.service_interest)},
  ${keepText("vehicle_type", s.vehicle_type)},
  ${keepText("district", s.district)},

  ${keepText("mentioned_vehicle_type", s.mentioned_vehicle_type)},
  ${keepText("confirmed_vehicle_type", s.confirmed_vehicle_type)},
  ${keepText("mentioned_district", s.mentioned_district)},
  ${keepText("confirmed_district", s.confirmed_district)},

  ${keepJsonb("missing_fields", s.missing_fields)},
  ${keepText("last_bot_action", s.last_bot_action)},
  ${keepText("next_goal", s.next_goal)},
  ${keepBool("human_handoff", s.human_handoff)},

  ${keepJsonb("booking_options", s.booking_options)},
  ${keepText("booking_date", s.booking_date)},
  ${keepText("booking_time", s.booking_time)},
  ${keepText("slot_id", s.slot_id)},
  ${keepBool("availability_confirmed", s.availability_confirmed)},

  ${keepText("availability_window", s.availability_window)},
  ${keepText("availability_label", s.availability_label)},
  ${keepText("calendar_id", s.calendar_id)},
  ${keepNumber("duration_minutes", s.duration_minutes)},
  ${keepNumber("days_ahead", s.days_ahead)},
  ${keepNumber("start_offset_days", s.start_offset_days)},
  ${keepNumber("max_slots", s.max_slots)},

  ${keepText("service_address", s.service_address)},
  ${keepText("address_reference", s.address_reference)},
  ${keepBool("address_confirmed", s.address_confirmed)},
  ${keepText("address_confirmed_at", s.address_confirmed_at)},

  ${keepText("cancellation_reason", s.cancellation_reason)},
  ${keepText("reschedule_reason", s.reschedule_reason)},
  ${keepText("last_appointment_event_id", s.last_appointment_event_id)},

  ${keepUuid("staff_id", s.staff_id)},
  ${keepText("staff_name", s.staff_name)},
  ${keepNumber("address_collection_attempts", s.address_collection_attempts)},

  ${keepText("payment_preference", s.payment_preference)},
  ${keepText("payment_status", s.payment_status)},
  ${keepText("flow_order_id", s.flow_order_id)},
  ${keepText("flow_payment_url", s.flow_payment_url)},
  ${keepText("payment_mode", s.payment_mode)},
  ${keepNumber("quoted_price", s.quoted_price)},

  updated_at = NOW()
WHERE lead_id = '${String(leadId).replace(/'/g, "''")}'::uuid
RETURNING
  lead_id,
  stage,
  intent_last,
  interest_score,
  service_interest,
  vehicle_type,
  district,
  mentioned_vehicle_type,
  confirmed_vehicle_type,
  mentioned_district,
  confirmed_district,
  missing_fields,
  last_bot_action,
  next_goal,
  human_handoff,
  booking_options,
  booking_date,
  booking_time,
  slot_id,
  availability_confirmed,
  availability_window,
  availability_label,
  calendar_id,
  duration_minutes,
  days_ahead,
  start_offset_days,
  max_slots,
  service_address,
  address_reference,
  address_confirmed,
  address_confirmed_at,
  cancellation_reason,
  reschedule_reason,
  last_appointment_event_id,
  staff_id,
  staff_name,
  address_collection_attempts,
  payment_preference,
  payment_status,
  flow_order_id,
  flow_payment_url,
  payment_mode,
  quoted_price,
  updated_at;
`;

return [
  {
    ...$json,
    update_lead_state_query: query,
  },
];
