// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        build_reschedule_success_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function serviceLabel(service) {
  const map = {
    lavado_basico: "lavado basico",
    lavado_premium: "lavado premium",
    encerado_full: "encerado full",
    lavado_profundo: "lavado premium",
    lavado_esencial: "lavado basico",
  };

  return map[service] || "el servicio";
}

function formatDateTime(value) {
  const start = new Date(value || Date.now());
  const fecha = start.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit"
  });
  const hora = start.toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit"
  });
  return { fecha, hora };
}

const service = serviceLabel($json.service_interest);
const when = formatDateTime($json.slot_start_at || $json.booking_date);

return [{
  ...$json,
  message_to_send: "Listo, tu " + service + " quedo reprogramado para el " + when.fecha + " a las " + when.hora,
  db_operations: ["appointments", "followups", "messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booked",
    intent_last: "reschedule_confirmed",
    next_goal: "pre_service_reminder",
    last_bot_action: "reschedule_booking",
    booking_date: null,
    booking_time: null,
    slot_id: null,
    availability_confirmed: null,
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "booking_rescheduled"
  ]
}];
