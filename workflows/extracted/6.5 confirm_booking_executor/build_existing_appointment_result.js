// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_existing_appointment_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const start = $json.start_at ? new Date($json.start_at) : null;

const fecha = start
  ? start.toLocaleDateString("es-CL", {
      timeZone: "America/Santiago",
      weekday: "long",
      day: "2-digit",
      month: "long"
    })
  : "una fecha prxima";

const hora = start
  ? start.toLocaleTimeString("es-CL", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit"
    })
  : "un horario confirmado";

return [{
  ...$json,
  message_to_send: `Ya tienes una reserva activa para el ${fecha} a las ${hora}. Si quieres, te ayudo a reprogramarla.`,
  db_operations: ["messages"],
  state_update: {
    ...($json.state_update || {}),
    last_bot_action: "booking_already_exists",
    next_goal: "reschedule_or_keep_booking"
  },
  notes: ["active_appointment_exists"]
}];
