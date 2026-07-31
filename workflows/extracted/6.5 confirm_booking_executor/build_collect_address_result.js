// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_collect_address_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $json.execution_context || {};

return [{
  ...$json,

  message_to_send:
    "Perfecto. Antes de confirmar la reserva necesito la dirección exacta donde se realizará el servicio. Puedes enviarme calle, número y alguna referencia.",

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...($json.state_update || {}),
    stage: "collecting_address",
    next_goal: "collect_address",
    last_bot_action: "collect_address",
    missing_fields: ["service_address"],

    booking_date: ctx.booking_date,
    booking_time: ctx.booking_time,
    slot_id: ctx.slot_id,
    availability_confirmed: ctx.availability_confirmed,
    duration_minutes: ctx.duration_minutes,
    calendar_id: ctx.calendar_id
  },

  execution_context: {
    ...ctx,
    action: "collect_address"
  },

  execution_result: {
    success: true,
    action: "collect_address",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: [
      ...($json.notes || []),
      "confirm_booking_paused_until_address"
    ]
  }
}];
