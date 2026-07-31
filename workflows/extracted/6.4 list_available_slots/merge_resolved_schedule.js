// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        merge_resolved_schedule
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("normalize_availability_input").first().json;
const row = $json || {};

const staffSchedule = Array.isArray(row.staff_schedule) ? row.staff_schedule : [];
const agentSchedule = Array.isArray(row.agent_schedule) ? row.agent_schedule : [];

const resolvedSchedule =
  Array.isArray(original.schedule) && original.schedule.length > 0
    ? original.schedule
    : (staffSchedule.length > 0 ? staffSchedule : agentSchedule);

return [{
  json: {
    ...original,
    schedule: resolvedSchedule
  }
}];
