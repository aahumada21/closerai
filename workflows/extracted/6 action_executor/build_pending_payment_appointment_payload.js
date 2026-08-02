// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_pending_payment_appointment_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json.calendar_event || $json;
const prepPayload = $("prepago_required_prep").first().json;
const slotCheck = $("Call 6.2 check_calendar_slot (hold)").first().json;
const ctx = prepPayload.execution_context || {};
const lead = prepPayload.context_packet?.lead || {};

if (!event?.id) {
  throw new Error("Missing real calendar event id (prepago hold)");
}

const startAt = event.start?.dateTime || slotCheck.slot_start_at;
const endAt = event.end?.dateTime || slotCheck.slot_end_at;

return [{
  ...prepPayload,
  appointment_payload: {
    event_id: event.id,
    conversation_id: ctx.lead_id,
    start_at: startAt,
    end_at: endAt,
    summary: event.summary || `${ctx.service_interest || "Servicio"} - ${lead.name || "Cliente"}`,
    description: event.description || "",
    status: "pending_payment",
    staff_id: ctx.staff_id || null
  }
}];
