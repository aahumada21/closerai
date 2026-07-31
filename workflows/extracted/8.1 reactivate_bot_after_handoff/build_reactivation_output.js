// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.1 reactivate_bot_after_handoff  (workflow id 0d6e1092-a477-4935-8607-10fa8e6947f0)
// Nodo:        build_reactivation_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $("validate_reactivation_input").first().json;
const closedCase = $("DB_Close_Open_Handoff_Cases").first().json || {};
const state = $("DB_Reactivate_Lead_State").first().json || {};
const audit = $json || {};

return [{
  success: true,
  action: "reactivate_bot_after_handoff",
  lead_id: input.lead_id,
  bot_reactivated: state?.human_handoff === false,
  handoff_case_closed: !!closedCase?.id,
  closed_handoff_case_id: closedCase?.id || null,
  new_state: {
    stage: state?.stage || input.resume_stage,
    human_handoff: state?.human_handoff ?? false,
    next_goal: state?.next_goal || input.next_goal,
    last_bot_action: state?.last_bot_action || "bot_reactivated_after_handoff"
  },
  audit_log_id: audit?.id || null,
  notes: [
    closedCase?.id ? "handoff_case_resolved" : "no_open_handoff_case_found",
    state?.lead_id ? "lead_state_reactivated" : "lead_state_not_found",
    state?.human_handoff === false ? "bot_can_reply_again" : "bot_reactivation_not_confirmed"
  ]
}];
