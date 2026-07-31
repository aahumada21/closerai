// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.22 handoff_human  (workflow id 0520cc38-8cfa-4188-a91a-b2ec332fed9c)
// Nodo:        normalize_handoff_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const handoffCaseId =
  $json.handoff_case_id ||
  $json.handoff?.handoff_case_id ||
  null;

const assignedTo =
  $json.assigned_to ||
  $json.handoff?.assigned_to ||
  null;

const assignedTeam =
  $json.assigned_team ||
  $json.handoff?.assigned_team ||
  null;

const notificationSent =
  $json.notification_sent === true ||
  $json.handoff?.notification_sent === true;

const existingStateUpdate = $json.state_update || {};
const handoffLocked = $json.handoff_locked === true;

return [
  {
    ...$json,

    handoff: true,
    handoff_case_id: handoffCaseId,
    assigned_to: assignedTo,
    assigned_team: assignedTeam,
    notification_sent: notificationSent,

    state_update: {
      ...existingStateUpdate,
      stage: "human_handoff",
      human_handoff: true,
      next_goal: handoffLocked ? "wait_human_response" : "human_takeover",
      last_bot_action: "handoff_human",
      missing_fields: []
    },

    db_operations: handoffLocked
      ? [...new Set([...( $json.db_operations || []), "messages", "lead_state"])]
      : [...new Set([...( $json.db_operations || []), "handoff_cases", "messages", "lead_state"])],

    notes: [
      ...($json.notes || []),
      ...(handoffLocked ? ["handoff_lock_active"] : ["handoff_case_created"]),
      notificationSent
        ? "handoff_notification_sent"
        : "handoff_notification_not_confirmed"
    ]
  }
];
