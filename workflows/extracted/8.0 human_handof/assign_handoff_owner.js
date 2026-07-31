// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.0 human_handof  (workflow id 2360b175-88ae-483d-8551-b2aa36c1c625)
// Nodo:        assign_handoff_owner
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const lead = $json.lead || {};
const state = $json.state || {};

let assigned_to = "contacto@aahumada.com";
let assigned_team = "ventas";
let priority = "normal";

if (($json.reason || "").toLowerCase().includes("reclamo")) {
  assigned_team = "soporte";
  priority = "high";
} else if (state.stage === "closing" || state.stage === "quoted") {
  assigned_team = "ventas";
}

return [{
  ...$json,
  assigned_to,
  assigned_team,
  priority
}];
