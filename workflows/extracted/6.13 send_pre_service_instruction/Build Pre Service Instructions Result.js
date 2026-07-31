// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.13 send_pre_service_instruction  (workflow id a9a040b3-31c0-459b-9c5e-aead2f7b9d28)
// Nodo:        Build Pre Service Instructions Result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $("Normalize Input").first().json;
const appointment = $json || {};

if (!appointment.id) {
  return [{
    ...input,
    message_to_send: "Por ahora no encontr una reserva activa asociada para enviarte las indicaciones previas. Si quieres, reviso tu agendamiento manualmente.",
    db_operations: ["messages", "lead_state"],
    state_update: {
      ...(input.state_update || {}),
      next_goal: "manual_booking_review",
      last_bot_action: "pre_service_instructions_no_active_appointment",
      missing_fields: []
    },
    notes: [
      ...(input.notes || []),
      "no_active_appointment_found_for_pre_service_instructions"
    ]
  }];
}
function formatDateTime(value) {
  if (!value) return "la fecha agendada";

  const d = new Date(value);

  return d.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

const appointmentDate = formatDateTime(appointment.start_at);

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

const service = serviceLabel(input.service_interest);

const vehicle = input.vehicle_type ? ` para tu ${input.vehicle_type}` : "";

const message =
`Perfecto. Te dejo las indicaciones previas para tu ${service}${vehicle} agendado para ${appointmentDate}.

Antes del servicio, idealmente:

1. Deja el vehiculo en un lugar accesible y con espacio para trabajar.
2. Retira objetos personales importantes del interior.
3. Si el maletero o los asientos estan muy cargados, intenta dejarlos despejados.
4. Ten disponible a alguien al momento de la llegada.
5. Si hay indicaciones especiales del domicilio, porton, conserje o estacionamiento, nos las puedes enviar por aca.

Con eso llegamos mejor preparados y evitamos atrasos.`;

return [{
  ...input,

  appointment,

  message_to_send: message,

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...(input.state_update || {}),
    stage: "booked",
    intent_last: "send_pre_service_instructions",
    next_goal: "service_prepared",
    last_bot_action: "send_pre_service_instructions",
    missing_fields: []
  },

  notes: [
    ...(input.notes || []),
    "pre_service_instructions_built"
  ]
}];
