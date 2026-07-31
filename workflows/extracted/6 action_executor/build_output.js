// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const action =
  $json.execution_context?.action ||
  $json.decision?.action ||
  $json.action ||
  null;
const outcome =
  $json.outcome ||
  $json.execution_result?.outcome ||
  $json.meta?.outcome ||
  null;

const lastBotAction =
  $json.state_update?.last_bot_action ||
  $json.lead_state_update?.last_bot_action ||
  $json.execution_result?.last_bot_action ||
  null;

const bot =
  $json.message ||
  $json.message_to_send ||
  $json.meta?.bot ||
  null;

const messageSent = $json.message_sent === true;

const toolRegistry =
  $json.meta?.tool_registry ||
  $json.tool_registry ||
  null;

const audit = {
  audit_id: $json.audit_id || null,
  flow_name: $json.flow_name || "action_executor",
  decision: $json.audit_decision || $json.decision || null,
  idempotency_key:
    $json.idempotency_key ||
    $json.execution_context?.idempotency_key ||
    null,
  inbound_message_id:
    $json.inbound_message_id ||
    $json.execution_context?.inbound_message_id ||
    null,
  outbound_message_id:
    $json.outbound_message_id ||
    null,
  tool_name:
    $json.tool_name ||
    $json.execution_context?.tool_name ||
    $json.meta?.tool_name ||
    $json.meta?.tool_registry?.tool_name ||
    $json.tool_registry?.tool_name ||
    (Array.isArray($json.meta?.tool_registry?.mapped_tool_names) ? $json.meta.tool_registry.mapped_tool_names[0] : null) ||
    (Array.isArray($json.tool_registry?.mapped_tool_names) ? $json.tool_registry.mapped_tool_names[0] : null) ||
    null,
  executor_ref:
    $json.executor_ref ||
    $json.execution_context?.executor_ref ||
    $json.meta?.executor_ref ||
    null,
  agent_id:
    $json.agent_id ||
    $json.execution_context?.agent_id ||
    $json.meta?.agent_id ||
    null,
  tool_registry: toolRegistry
};

const qaFailedReasons = [];

if (!bot) qaFailedReasons.push("bot_null");
if (messageSent !== true) qaFailedReasons.push("message_sent_not_true");
if (!audit.flow_name) qaFailedReasons.push("flow_name_null");
if (!audit.decision) qaFailedReasons.push("decision_null");
if (!audit.idempotency_key) qaFailedReasons.push("idempotency_key_null");
if (!audit.audit_id && $json.message_sent === true) {
  qaFailedReasons.push("audit_not_inserted");
}

if (!audit.inbound_message_id) {
  qaFailedReasons.push("inbound_message_id_null");
}

if (!audit.outbound_message_id && $json.outbound_message_saved === true) {
  qaFailedReasons.push("audit_outbound_message_id_null");
}
if ($json.outbound_message_saved !== true && bot) {
  qaFailedReasons.push("outbound_message_not_saved");
}
const isHandoff = action === "handoff_human";

const handoffResult = {
  human_handoff:
    $json.state_update?.human_handoff === true ||
    $json.lead_state_update?.human_handoff === true ||
    $json.handoff === true,

  handoff_case_id:
    $json.handoff_case_id ||
    $json.meta?.handoff?.handoff_case_id ||
    null,

  assigned_to:
    $json.assigned_to ||
    $json.meta?.handoff?.assigned_to ||
    null,

  assigned_team:
    $json.assigned_team ||
    $json.meta?.handoff?.assigned_team ||
    null,

  notification_sent:
    $json.notification_sent === true ||
    $json.meta?.handoff?.notification_sent === true
};

if (isHandoff) {
  if (handoffResult.human_handoff !== true) {
    qaFailedReasons.push("handoff_human_not_true");
  }

  if (!handoffResult.handoff_case_id) {
    qaFailedReasons.push("handoff_case_id_null");
  }

  if (!handoffResult.assigned_to) {
    qaFailedReasons.push("assigned_to_null");
  }

  if (!handoffResult.assigned_team) {
    qaFailedReasons.push("assigned_team_null");
  }

  if (handoffResult.notification_sent !== true) {
    qaFailedReasons.push("notification_sent_not_true");
  }
}
const proposedStateUpdate =
  $json.proposed_state_update ||
  $json.decision?.state_update ||
  {};
const sanitizedStateUpdate =
  $json.sanitized_state_update ||
  $json.state_update ||
  {};

function normalizeCompareValue(value) {
  if (value === undefined) return "__undefined__";
  if (value === null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value;
}

function valuesMatch(expected, actual) {
  const e = normalizeCompareValue(expected);
  const a = normalizeCompareValue(actual);

  if (e === "__undefined__") return true;

  if (typeof e === "boolean") {
    return a === e || String(a).toLowerCase() === String(e);
  }

  return JSON.stringify(e) === JSON.stringify(a);
}

const persistedStateCurrent =
  $json.persisted_state_current ||
  $json.state?.current ||
  null;

const stateMismatchFields = [];



if ($json.state_updated === true && persistedStateCurrent) {
  const keysToCompare = [
    "stage",
    "intent_last",
    "service_interest",
    "vehicle_type",
    "district",
    
    "mentioned_vehicle_type",
    "confirmed_vehicle_type",
    "mentioned_district",
    "confirmed_district",

    "last_bot_action",
    "next_goal",
    "human_handoff",
    "booking_date",
    "booking_time",
    "slot_id",
    "availability_confirmed",
    "service_address",
    "address_reference",
    "address_confirmed",
    "cancellation_reason",
    "reschedule_reason",
    "last_appointment_event_id"
  ];

  for (const key of keysToCompare) {
    if (sanitizedStateUpdate[key] === undefined) continue;

  if (!valuesMatch(sanitizedStateUpdate[key], persistedStateCurrent[key])) {
  stateMismatchFields.push({
    field: key,
    expected: sanitizedStateUpdate[key],
    actual: persistedStateCurrent[key],
  });
}
}
}

if (stateMismatchFields.length > 0) {
  qaFailedReasons.push(
    "state_current_does_not_match_sanitized_state_update:" +
    JSON.stringify(stateMismatchFields)
  );
}
if ($json.state_updated === true && !persistedStateCurrent) {
  qaFailedReasons.push("state_current_missing_after_update");
}

return [{
  execution_result: {
    success: qaFailedReasons.length === 0,
    action,
    outcome,
    last_bot_action: lastBotAction,
    bot,
    message_sent: messageSent,
    message_saved: $json.outbound_message_saved === true,
    outbound_message_id: $json.outbound_message_id || null,
    state_updated: $json.state_updated === true,
    state: {
  proposed_update: proposedStateUpdate,
  sanitized_update: sanitizedStateUpdate,
  current: persistedStateCurrent,
  mismatch_fields: stateMismatchFields,
},

    handoff: isHandoff ? handoffResult : null,
    
    audit,
    tool_registry: toolRegistry,
    qa: {
      passed: qaFailedReasons.length === 0,
      failed_reasons: qaFailedReasons
    },
    db_records_created: $json.records || $json.db_operations || [],
    notes: $json.notes || []
  }
}];
