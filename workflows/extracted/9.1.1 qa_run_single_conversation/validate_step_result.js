// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        validate_step_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function nodeJson(name) {
  try {
    return $(name).item.json || {};
  } catch (error) {
    return {};
  }
}

function firstObject(...objects) {
  return objects.find((value) => value && Object.keys(value).length > 0) || {};
}

const input = nodeJson("build_inbound_payload");
const lead = firstObject(nodeJson("get_lead"), nodeJson("get_lead_before"));
const previousState = nodeJson("get_state_before");
const currentState = nodeJson("get_state_after");
const lastMessage = nodeJson("get_last_outbound_message");
const immediateAudit = nodeJson("get_last_audit");
const webhookResp = nodeJson("send_to_bot_webhook");
const webhookStatus = webhookResp.statusCode || null;
const webhookBody = webhookResp.body || webhookResp;

const expect = input.expect || {};
const errors = [];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesAll(text, values = []) {
  const normalizedText = normalize(text);
  return values.every((value) => normalizedText.includes(normalize(value)));
}

function includesAny(text, values = []) {
  const normalizedText = normalize(text);
  return values.some((value) => normalizedText.includes(normalize(value)));
}

function notIncludesAny(text, values = []) {
  const raw = String(text || "");
  return values.every((value) => !raw.includes(String(value || "")));
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}

const expectedQaMessageId = String(input.qa_message_id || "");

function auditMatchesStep(audit) {
  if (!audit || Object.keys(audit).length === 0 || !expectedQaMessageId) return false;
  const auditIdempotencyKey = String(audit.idempotency_key || "");
  const auditInboundMessageId = String(audit.inbound_message_id || "");
  const auditLatestUserMessage = String(audit.latest_user_message || "");
  return (
    auditIdempotencyKey.includes(expectedQaMessageId) ||
    auditInboundMessageId === expectedQaMessageId ||
    normalize(auditLatestUserMessage) === normalize(input.text)
  );
}

const auditCandidates = [
  nodeJson("get_outbound_attempt_3"),
  nodeJson("get_outbound_attempt_2"),
  nodeJson("get_outbound_attempt_1"),
  immediateAudit
].filter((audit) => audit && Object.keys(audit).length > 0);

const lastAudit = auditCandidates.find(auditMatchesStep) || immediateAudit || {};

const responseText =
  lastAudit.meta?.bot ||
  lastAudit.meta?.message ||
  lastMessage.content ||
  "";
const hasBotResponse = String(responseText || "").trim() !== "";

const lastBotAction = currentState.last_bot_action || null;
const stage = currentState.stage || null;
const nextGoal = currentState.next_goal || null;
const hasAction = lastBotAction !== null && String(lastBotAction).trim() !== "";

const stateChanged =
  String(previousState.stage || "") !== String(currentState.stage || "") ||
  String(previousState.next_goal || "") !== String(currentState.next_goal || "") ||
  String(previousState.service_interest || "") !== String(currentState.service_interest || "") ||
  String(previousState.vehicle_type || "") !== String(currentState.vehicle_type || "") ||
  String(previousState.district || "") !== String(currentState.district || "");

const idempotencyKey = String(lastAudit.idempotency_key || "");
const inboundMessageId = String(lastAudit.inbound_message_id || "");
const latestUserMessage = String(lastAudit.latest_user_message || "");
const auditMatchesCurrentStep =
  !!expectedQaMessageId &&
  (
    idempotencyKey.includes(expectedQaMessageId) ||
    inboundMessageId === expectedQaMessageId ||
    normalize(latestUserMessage) === normalize(input.text)
  );

const hasRealAudit =
  !!lastAudit.flow_name &&
  !!lastAudit.decision &&
  !!lastAudit.idempotency_key &&
  auditMatchesCurrentStep;

const resolvedFlowName = hasRealAudit ? lastAudit.flow_name : null;
const resolvedDecision = hasRealAudit ? lastAudit.decision : null;
const resolvedIdempotencyKey = hasRealAudit ? lastAudit.idempotency_key : null;
const hasAudit = hasRealAudit;
const decisionAction = resolvedDecision?.action || null;

const auditMeta = hasRealAudit && lastAudit.meta ? lastAudit.meta : {};
const auditToolRegistry = auditMeta.tool_registry || auditMeta.execution_result?.tool_registry || {};
const organizationId = firstValue(
  currentState.organization_id,
  lead.organization_id,
  auditMeta.organization_id,
  auditToolRegistry.organization_id,
  input.routing?.organization_id
);
const agentId = firstValue(
  currentState.agent_id,
  lead.agent_id,
  auditMeta.agent_id,
  auditToolRegistry.agent_id,
  input.routing?.agent_id
);
const toolName = firstValue(
  auditMeta.tool_name,
  auditToolRegistry.tool_name,
  auditMeta.execution_result?.audit?.tool_name,
  Array.isArray(auditToolRegistry.mapped_tool_names) ? auditToolRegistry.mapped_tool_names[0] : null
);

const isStubResponse =
  normalize(responseText) === normalize("Workflow was started") ||
  normalize(responseText) === normalize("workflow started");

const expectedNoProcess = expect.should_process === false;
const auditCreatedAtMs = Date.parse(lastAudit.created_at || "");
const inputSentAtMs = Date.parse(input.sent_at || "");
const isPreviousAuditReplay =
  expectedNoProcess &&
  hasAudit &&
  Number.isFinite(auditCreatedAtMs) &&
  Number.isFinite(inputSentAtMs) &&
  auditCreatedAtMs < inputSentAtMs;
const isDiscardAudit =
  hasAudit &&
  (
    isPreviousAuditReplay ||
    (
      resolvedFlowName === "qa_whatsapp_normalized_router" &&
      (
        decisionAction === "not_processed" ||
        auditMeta.event_type === "discarded_inbound_event" ||
        auditMeta.should_process === false
      )
    )
  );

if (!expectedNoProcess) {
  if ((webhookBody.code && Number(webhookBody.code) !== 200) || String(webhookBody.message || "").toLowerCase().includes("error")) {
    errors.push(`webhook_error: status=${webhookStatus || "n/a"} message=${webhookBody.message || "unknown"}`);
  }
  if (!hasBotResponse) errors.push("bot is null or empty");
  if (isStubResponse) errors.push("invalid_stub_response: workflow ack is not a bot response");
  if (!hasAudit) errors.push("empty audit: missing flow_name, decision, idempotency_key or current-step correlation");
  if (!hasBotResponse && !hasAction && !stateChanged) errors.push("no response, no action, no state change");
} else if ((hasBotResponse && !isPreviousAuditReplay) || stateChanged || (hasAudit && !isDiscardAudit)) {
  errors.push("expected no processing, but bot/action/state or non-discard audit was found");
}

if (Array.isArray(expect.last_bot_action_any) && expect.last_bot_action_any.length > 0) {
  if (!expect.last_bot_action_any.includes(lastBotAction)) {
    errors.push(`expected last_bot_action: ${expect.last_bot_action_any.join(", ")} | received: ${lastBotAction}`);
  }
}

if (Array.isArray(expect.decision_action_any) && expect.decision_action_any.length > 0) {
  if (!expect.decision_action_any.includes(decisionAction)) {
    errors.push(`expected decision_action: ${expect.decision_action_any.join(", ")} | received: ${decisionAction}`);
  }
}

if (Array.isArray(expect.stage_any) && expect.stage_any.length > 0 && !expect.stage_any.includes(stage)) {
  errors.push(`expected stage: ${expect.stage_any.join(", ")} | received: ${stage}`);
}

if (Array.isArray(expect.next_goal_any) && expect.next_goal_any.length > 0 && !expect.next_goal_any.includes(nextGoal)) {
  errors.push(`expected next_goal: ${expect.next_goal_any.join(", ")} | received: ${nextGoal}`);
}

if (Array.isArray(expect.tool_name_any) && expect.tool_name_any.length > 0 && !expect.tool_name_any.includes(toolName)) {
  errors.push(`expected tool_name: ${expect.tool_name_any.join(", ")} | received: ${toolName}`);
}

if (expect.must_have_agent === true && !agentId) errors.push("agent_id missing");
if (expect.must_have_organization === true && !organizationId) errors.push("organization_id missing");
if (expect.expected_agent_id && String(agentId) !== String(expect.expected_agent_id)) {
  errors.push(`expected agent_id: ${expect.expected_agent_id} | received: ${agentId}`);
}
if (expect.expected_organization_id && String(organizationId) !== String(expect.expected_organization_id)) {
  errors.push(`expected organization_id: ${expect.expected_organization_id} | received: ${organizationId}`);
}

if (Array.isArray(expect.response_includes) && expect.response_includes.length > 0 && !includesAll(responseText, expect.response_includes)) {
  errors.push(`response missing required text: ${expect.response_includes.join(", ")}`);
}

if (Array.isArray(expect.response_includes_any) && expect.response_includes_any.length > 0 && !includesAny(responseText, expect.response_includes_any)) {
  errors.push(`response missing any-of text: ${expect.response_includes_any.join(", ")}`);
}

if (Array.isArray(expect.response_not_includes) && expect.response_not_includes.length > 0 && !notIncludesAny(responseText, expect.response_not_includes)) {
  errors.push(`response contains forbidden text: ${expect.response_not_includes.join(", ")}`);
}

const passed = errors.length === 0;

return [
  {
    json: {
      run_id: input.run_id,
      scenario_id: input.scenario_id,
      scenario_name: input.scenario_name,
      step_index: input.step_index,
      text_sent: input.text,
      passed,
      errors,
      lead_id: lead.id || null,
      bot_response: responseText,
      agent_id: agentId,
      organization_id: organizationId,
      decision_action: decisionAction,
      tool_name: toolName,
      audit_ok: hasAudit,
      state_snapshot: {
        previous: {
          stage: previousState.stage || null,
          next_goal: previousState.next_goal || null,
          last_bot_action: previousState.last_bot_action || null,
          service_interest: previousState.service_interest || null,
          vehicle_type: previousState.vehicle_type || null,
          district: previousState.district || null,
          organization_id: previousState.organization_id || null,
          agent_id: previousState.agent_id || null
        },
        current: {
          stage,
          next_goal: nextGoal,
          last_bot_action: lastBotAction,
          service_interest: currentState.service_interest || null,
          vehicle_type: currentState.vehicle_type || null,
          district: currentState.district || null,
          organization_id: currentState.organization_id || null,
          agent_id: currentState.agent_id || null
        },
        changed: stateChanged
      },
      audit_snapshot: {
        flow_name: resolvedFlowName,
        decision: resolvedDecision,
        idempotency_key: resolvedIdempotencyKey,
        inbound_message_id: hasRealAudit ? inboundMessageId : null,
        outbound_message_id: hasRealAudit ? (lastAudit.outbound_message_id || null) : null,
        latest_user_message: hasRealAudit ? latestUserMessage : null,
        matched_current_step: auditMatchesCurrentStep,
        organization_id: organizationId,
        agent_id: agentId,
        tool_name: toolName,
        audit_ok: hasAudit,
        is_discard_audit: isDiscardAudit,
        is_discard_audit: isDiscardAudit,
        meta: lastAudit.meta || null,
        created_at: lastAudit.created_at || null
      },
      qa_checks: {
        has_bot_response: hasBotResponse,
        has_action: hasAction,
        state_changed: stateChanged,
        has_audit: hasAudit,
        expected_no_process: expectedNoProcess,
        agent_id: agentId,
        organization_id: organizationId,
        decision_action: decisionAction,
        tool_name: toolName,
        audit_ok: hasAudit,
        is_discard_audit: isDiscardAudit
      },
      created_at: new Date().toISOString()
    }
  }
];
