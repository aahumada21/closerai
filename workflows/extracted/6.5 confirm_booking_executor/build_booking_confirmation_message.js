// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_booking_confirmation_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function serviceLabel(service, configuredServices) {
  const map = {
    "lavado_basico": "lavado basico",
    "lavado_premium": "lavado premium",
    "encerado_full": "encerado full",
    "lavado_profundo": "lavado premium",
    "lavado_esencial": "lavado basico"
  };

  if (map[service]) return map[service];

  const found = (configuredServices || []).find((s) => s.key === service);
  if (found && found.name) return found.name;

  return service ? String(service).replace(/_/g, " ") : "el servicio";
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

const ctx = $json.execution_context || {};
const lead = $json.context_packet?.lead || {};
const appointment = $json.appointment_payload || {};
const calendarEvent = $json.calendar_event || {};

const startRaw = appointment.start_at || calendarEvent.start?.dateTime || $json.start_at || null;
const start = startRaw ? new Date(startRaw) : null;

const fecha = start && !isNaN(start.getTime())
  ? start.toLocaleDateString("es-CL", { timeZone: "America/Santiago", weekday: "long", day: "2-digit", month: "long" })
  : firstValue(ctx.booking_date, $json.booking_date, "la fecha acordada");

const hora = start && !isNaN(start.getTime())
  ? start.toLocaleTimeString("es-CL", { timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hour12: false })
  : firstValue(ctx.booking_time, $json.booking_time, "el horario acordado");

const rawBusinessConfig = $json.agent_business_config?.config || $json.context_packet?.agent_business_config?.config || null;
const requiresPricingContext = rawBusinessConfig?.pricing_policy?.requires_service_vehicle_district !== false;
const configuredServices = Array.isArray(rawBusinessConfig?.services) ? rawBusinessConfig.services : [];

const service = serviceLabel(firstValue(ctx.service_interest, $json.booking_context?.service_interest, $json.context_packet?.state?.service_interest), configuredServices);
const district = firstValue(ctx.district, $json.booking_context?.district, $json.context_packet?.state?.district);
const address = firstValue(ctx.service_address, ctx.address, $json.booking_request?.service_address, $json.state_update?.service_address, $json.context_packet?.state?.service_address);

const districtText = (district && requiresPricingContext) ? `Comuna: ${district}. ` : "";
const addressText = address ? `Direccion: ${address}. ` : "";
const closingText = requiresPricingContext
  ? "Te escribire antes de la visita para coordinar."
  : "Te esperamos en nuestro local.";

const finalMessage = `Perfecto, tu reserva quedo confirmada para el ${fecha} a las ${hora}. ` +
  `Servicio: ${service}. ` +
  districtText +
  addressText +
  closingText;

return [{
  ...$json,
  message_to_send: finalMessage,
  message: finalMessage,
  db_operations: ["appointments", "messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booked",
    intent_last: "booking_confirmed",
    next_goal: "send_pre_service_instructions",
    last_bot_action: "confirm_booking",
    service_interest: firstValue(ctx.service_interest, $json.context_packet?.state?.service_interest),
    vehicle_type: firstValue(ctx.vehicle_type, $json.context_packet?.state?.vehicle_type),
    district,
    booking_date: firstValue(ctx.booking_date, $json.booking_date),
    booking_time: firstValue(ctx.booking_time, $json.booking_time),
    slot_id: firstValue(ctx.slot_id, $json.slot_id),
    availability_confirmed: true,
    service_address: address,
    address_reference: firstValue(ctx.address_reference, $json.booking_request?.address_reference, $json.state_update?.address_reference),
    address_confirmed: true,
    last_appointment_event_id: firstValue(appointment.event_id, calendarEvent.id, $json.event_id),
    missing_fields: []
  },
  execution_result: {
    success: true,
    action: "confirm_booking",
    outcome: "booking_confirmed",
    bot: finalMessage,
    message_sent: false,
    state_updated: true,
    db_records_created: ["appointments", "messages", "lead_state"],
    notes: [...($json.notes || []), "booking_confirmed_with_real_event"]
  },
  notes: [...($json.notes || []), "booking_confirmed_with_real_event"]
}];
