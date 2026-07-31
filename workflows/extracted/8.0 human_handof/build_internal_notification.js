// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.0 human_handof  (workflow id 2360b175-88ae-483d-8551-b2aa36c1c625)
// Nodo:        build_internal_notification
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const lead = $json.lead || {};
const state = $json.state || {};
const conversation = $json.conversation || {};

const text = [
  `Nuevo handoff humano`,
  `Caso ID: ${$json.id || "sin_id"}`,
  `Lead ID: ${lead.id || $json.lead_id}`,
  `Nombre: ${lead.name || "Sin nombre"}`,
  `Telfono: ${lead.phone || "Sin telfono"}`,
  `Etapa: ${state.stage || "sin_stage"}`,
  `Razn: ${$json.reason || "sin razn"}`,
  `Resumen: ${$json.summary || "sin resumen"}`,
  `ltimo mensaje: ${conversation.latest_user_message || "sin mensaje"}`,
  `Servicio: ${state.service_interest || "N/D"}`,
  `Vehculo: ${state.vehicle_type || "N/D"}`,
  `Comuna: ${state.district || "N/D"}`,
  `Asignado a: ${$json.assigned_to || "N/D"}`
].join('\n');

return [{
  ...$json,
  notification_text: text
}];
