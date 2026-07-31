// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        return_confirm_booking_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const action =
  $json.execution_context?.action ||
  $json.execution_result?.action ||
  "confirm_booking";

const records =
  $json.execution_result?.db_records_created ||
  $json.db_operations ||
  ["messages", "lead_state"];

return [{
  ...$json,

  execution_result: {
    success: $json.execution_result?.success !== false && $json.error !== true,
    action,
    message_sent: $json.message_sent === true,
    state_updated: true,
    db_records_created: records,
    notes: [
      ...($json.notes || []),
      ...($json.execution_result?.notes || []),
      "confirm_booking_subworkflow_done"
    ]
  }
}];
