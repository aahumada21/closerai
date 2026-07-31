// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_real_appointment_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json.calendar_event || $json;
const ctx = $json.execution_context || {};
const lead = $json.context_packet?.lead || {};

if (!ctx.lead_id) {
  throw new Error("Missing execution_context.lead_id");
}

if (!event?.id) {
  throw new Error("Missing real calendar event id");
}

const startAt = event.start?.dateTime || event.start_at || null;
const endAt = event.end?.dateTime || event.end_at || null;

if (!startAt || !endAt) {
  throw new Error("Missing event start/end datetime");
}

return [{
  ...$json,
  appointment_payload: {
    event_id: event.id,
    conversation_id: ctx.lead_id,
    start_at: startAt,
    end_at: endAt,
    summary: event.summary || `${ctx.service_interest || "Servicio"} - ${lead.name || "Cliente"}`,
    description: event.description || "",
    status: "confirmed",
    staff_id: ctx.staff_id || null
  }
}];
