// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
// Nodo:        validate_reactivation_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!input.lead_id || !uuidRegex.test(input.lead_id)) {
  throw new Error(`Invalid or missing lead_id: ${input.lead_id || "empty"}`);
}

const resolvedBy = input.resolved_by || "human_operator";
const resolutionNote =
  input.resolution_note ||
  "Caso resuelto manualmente. Bot reactivado.";

const resumeStage = input.resume_stage || "closing";
const nextGoal = input.next_goal || "continue_conversation";

return [{
  lead_id: input.lead_id,
  resolved_by: resolvedBy,
  resolution_note: resolutionNote,
  resume_stage: resumeStage,
  next_goal: nextGoal,
  reactivated_at: new Date().toISOString()
}];
