// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        normalize_calendar_reschedule_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("merge_slot_check_with_context").first().json;

return [{
  ...original,
  calendar_rescheduled: true,
  calendar_event_id:
    $json.id ||
    original.active_appointment?.event_id ||
    null,
  calendar_result: $json,
  notes: [
    ...(original.notes || []),
    "calendar_event_rescheduled"
  ]
}];
