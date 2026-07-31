// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        persist_results
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const result = $json;

return [{
  ...result,
  action:
    $json.action ??
    $json.decision?.action ??
    $json.execution_context?.action ??
    "schedule_followup",
  persisted: true,
  records: result.db_operations || result.records || [],
  state_updated: !!result.lead_state_update || !!result.state_update,
  message_sent: result.message_sent === true,
}];
