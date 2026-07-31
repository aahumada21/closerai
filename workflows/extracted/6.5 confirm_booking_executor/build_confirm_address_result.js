// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_confirm_address_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $json.execution_context || {};

const address = ctx.service_address || ctx.address || "";
const reference = ctx.address_reference || "";

const referenceText = reference
  ? `\nReferencia: ${reference}`
  : "";

return [{
  ...$json,

  message_to_send:
    `Perfecto, tengo esta dirección para el servicio:\n\n${address}${referenceText}\n\nEst correcta? Responde "s" para confirmarla o envíame la dirección corregida.`,

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...($json.state_update || {}),
    stage: "address_confirmation",
    next_goal: "confirm_address",
    last_bot_action: "confirm_address_in_progress",
    service_address: address,
    address_reference: reference,
    address_confirmed: false,
    missing_fields: [],

    booking_date: ctx.booking_date,
    booking_time: ctx.booking_time,
    slot_id: ctx.slot_id,
    availability_confirmed: ctx.availability_confirmed,
    duration_minutes: ctx.duration_minutes,
    calendar_id: ctx.calendar_id
  },

  execution_context: {
    ...ctx,
    action: "confirm_address",
    service_address: address,
    address: address,
    address_reference: reference,
    address_confirmed: false
  },

  execution_result: {
    success: true,
    action: "confirm_address",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: [
      ...($json.notes || []),
      "confirm_booking_paused_until_address_confirmation"
    ]
  }
}];
