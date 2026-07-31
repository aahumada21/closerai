// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        build_available_slots_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const slots = Array.isArray($json.slots) ? $json.slots : [];

return [{
  ...$json,
  success: true,
  slots,
  available_slots: slots,
  booking_options: slots,
  availability_window: $json.availability_window || "this_week",
  availability_label: $json.availability_label || "los proximos dias",
  checked_at: $json.checked_at || new Date().toISOString()
}];
