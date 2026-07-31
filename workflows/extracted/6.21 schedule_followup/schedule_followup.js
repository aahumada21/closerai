// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.21 schedule_followup  (workflow id 9a8541cd-8c27-4aa1-9d93-4a2a290bfe74)
// Nodo:        schedule_followup
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const decision = $json.decision || {};
const ctx = $json.execution_context || {};

const fallbackMessage = "Perfecto, ningun problema. Te escribo manana para retomar y, si quieres, agendamos.";
const message =
  $json.message_to_send ||
  $json.message ||
  decision.message ||
  fallbackMessage;

const followupType =
  ctx.followup_type ||
  decision.followup_type ||
  $json.followup_type ||
  "generic_followup";

const scheduledFor =
  ctx.scheduled_for ||
  decision.scheduled_for ||
  $json.scheduled_for ||
  null;

const baseStateUpdate = ctx.state_update || $json.state_update || {};

return [{
  ...$json,

  action: "schedule_followup",

  message_to_send: message,
  message,

  db_operations: ["followups", "messages", "lead_state"],

  followup: {
    type: followupType,
    scheduled_for: scheduledFor
  },

  state_update: {
    ...baseStateUpdate,
    stage: baseStateUpdate.stage || "closing",
    intent_last: baseStateUpdate.intent_last || "followup_scheduled",
    next_goal: baseStateUpdate.next_goal || "wait_followup",
    last_bot_action: "schedule_followup"
  },

  execution_result: {
    ...($json.execution_result || {}),
    success: true,
    action: "schedule_followup",
    bot: message
  }
}];
