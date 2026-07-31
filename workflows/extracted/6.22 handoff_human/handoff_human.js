// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.22 handoff_human  (workflow id 0520cc38-8cfa-4188-a91a-b2ec332fed9c)
// Nodo:        handoff_human
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const alreadyInHandoff =
  $json.context_packet?.state?.human_handoff === true ||
  $json.handoff === true ||
  $json.meta?.handoff?.human_handoff === true ||
  $json.context_packet?.state?.last_bot_action === "human_handoff_already_active";

const lockMessage =
  "Tu reclamo ya esta derivado al equipo. Una persona lo revisara y te respondera por este mismo chat para ayudarte.";

const defaultMessage =
  $json.execution_context?.message ||
  "Te voy a derivar con una persona para ayudarte mejor.";

const handoffLocked = alreadyInHandoff;

return [{
  ...$json,
  handoff_locked: handoffLocked,
  message_to_send: handoffLocked ? lockMessage : defaultMessage,
  db_operations: handoffLocked
    ? ["messages", "lead_state"]
    : ["handoff_cases", "messages", "lead_state"],
  handoff_case: handoffLocked
    ? null
    : {
        lead_id: $json.execution_context?.lead_id || $json.lead_id || $json.context_packet?.lead?.id || $json.context_packet?.state?.lead_id || $json.context_packet?.event?.lead_id || null,
        reason: $json.execution_context?.handoff_reason || "handoff requested",
        summary:
          $json.execution_context?.handoff_summary ||
          $json.context_packet?.conversation?.latest_user_message ||
          "Sin resumen",
        lead: { ...($json.context_packet?.lead || {}), id: $json.execution_context?.lead_id || $json.lead_id || $json.context_packet?.lead?.id || $json.context_packet?.state?.lead_id || $json.context_packet?.event?.lead_id || null },
        state: { ...($json.context_packet?.state || {}), lead_id: $json.execution_context?.lead_id || $json.lead_id || $json.context_packet?.lead?.id || $json.context_packet?.state?.lead_id || $json.context_packet?.event?.lead_id || null },
        conversation: $json.context_packet?.conversation || {},
        metadata: {
          source_action: "handoff_human",
          idempotency_key: $json.execution_context?.idempotency_key || null
        }
      },
  state_update: {
    ...($json.execution_context?.state_update || {}),
    stage: "human_handoff",
    human_handoff: true,
    next_goal: handoffLocked ? "wait_human_response" : "human_takeover",
    last_bot_action: "handoff_human",
    missing_fields: []
  }
}];
