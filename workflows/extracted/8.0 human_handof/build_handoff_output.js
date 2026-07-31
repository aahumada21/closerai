// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 8.0 human_handof  (workflow id 2360b175-88ae-483d-8551-b2aa36c1c625)
// Nodo:        build_handoff_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const caseRow = (() => {
  try {
    return $("update_handoff_notification_status").first().json;
  } catch {
    try {
      return $("insert_handoff_case").first().json;
    } catch {
      return {};
    }
  }
})();

const owner = (() => {
  try {
    return $("assign_handoff_owner").first().json;
  } catch {
    return {};
  }
})();

const notificationSent =
  caseRow.notification_sent === true ||
  !!caseRow.notification_sent_at ||
  !!caseRow.notified_at;

return [
  {
    handoff: true,

    handoff_case_id: caseRow.id || null,
    lead_id: caseRow.lead_id || owner.lead_id || $json.lead_id || null,

    assigned_to: caseRow.assigned_to || owner.assigned_to || null,
    assigned_team: caseRow.assigned_team || owner.assigned_team || null,
    priority: caseRow.priority || owner.priority || "normal",

    notification_sent: notificationSent,
    notification_channel: caseRow.notification_channel || "email",
    notification_sent_at:
      caseRow.notification_sent_at ||
      caseRow.notified_at ||
      null,

    summary: caseRow.summary || owner.summary || null,
    reason: caseRow.reason || owner.reason || null,

    handoff_operational: {
      human_handoff: true,
      handoff_case_created: !!caseRow.id,
      assigned: !!(caseRow.assigned_to || owner.assigned_to),
      notification_sent: notificationSent
    }
  }
];
