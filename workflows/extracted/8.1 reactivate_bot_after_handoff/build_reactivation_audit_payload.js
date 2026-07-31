// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
// Nodo:        build_reactivation_audit_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $("validate_reactivation_input").first().json;
const handoffResult = $("DB_Close_Open_Handoff_Cases").first().json || {};
const stateResult = $("DB_Reactivate_Lead_State").first().json || {};

const closedCaseId = handoffResult?.id || null;

return [{
  flow_name: "reactivate_bot_after_handoff",
  lead_id: originalInput.lead_id,
  channel: "internal",
  stage_before: "human_handoff",
  latest_user_message: null,
  allowed_actions: [],
  decision: {
    action: "reactivate_bot",
    reason: "Human handoff resolved manually"
  },
  meta: {
    resolved_by: originalInput.resolved_by,
    resolution_note: originalInput.resolution_note,
    closed_handoff_case_id: closedCaseId,
    handoff_case_closed: !!closedCaseId,
    new_state: {
      stage: stateResult.stage || originalInput.resume_stage,
      human_handoff: stateResult.human_handoff ?? false,
      next_goal: stateResult.next_goal || originalInput.next_goal,
      last_bot_action: stateResult.last_bot_action || "bot_reactivated_after_handoff"
    }
  },
  llm: null,
  idempotency_key: `${originalInput.lead_id}__reactivate_bot__${Date.now()}`,
  created_at: new Date().toISOString()
}];
