// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        Debug extract content
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,
  debug_booking_options_is_array: Array.isArray($json.lead_state?.booking_options),
  debug_booking_options_count: Array.isArray($json.lead_state?.booking_options)
    ? $json.lead_state.booking_options.length
    : 0,
  debug_stage: $json.lead_state?.stage,
  debug_next_goal: $json.lead_state?.next_goal,
  debug_last_bot_action: $json.lead_state?.last_bot_action,
  debug_text: $json.event?.text
}];
