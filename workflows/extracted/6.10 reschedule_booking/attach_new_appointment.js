// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.10 reschedule_booking  (workflow id ece2fbb8-75d2-4496-9f6d-5bcb5abcdb40)
// Nodo:        attach_new_appointment
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("normalize_calendar_reschedule_result").first().json;

return [{
  ...original,
  new_appointment: $json,
  notes: [
    ...(original.notes || []),
    "appointment_updated_after_reschedule"
  ]
}];
