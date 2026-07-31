// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        attach_active_appointment
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("normalize_reschedule_input").first().json;

const activeAppointment = $json.id
  ? {
      id: $json.id,
      event_id: $json.event_id,
      conversation_id: $json.conversation_id,
      start_at: $json.start_at,
      end_at: $json.end_at,
      summary: $json.summary,
      description: $json.description,
      status: $json.status,
      service_address: $json.service_address,
      address_reference: $json.address_reference
    }
  : null;

return [{
  ...original,
  active_appointment: activeAppointment,
  notes: [
    ...(original.notes || []),
    activeAppointment ? "active_appointment_found" : "no_active_appointment_found"
  ]
}];
