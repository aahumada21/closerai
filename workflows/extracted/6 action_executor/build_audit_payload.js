// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_audit_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $("IN LLM_Descision").first().json;

const contextPacket =
  $json.context_packet ||
  originalInput.context_packet ||
  {};

const decision =
  $json.decision ||
  originalInput.decision ||
  null;

const executionContext = {
  ...($json.execution_context || {})
};

const toolRegistry = $json.tool_registry || {};

const messageActions = new Set([
  "ask_missing_data",
  "answer_question",
  "answer_objection",
  "offer_booking",
  "send_service_menu",
  "recommend_service",
  "ask_payment_preference",
  "collect_address",
  "confirm_address",
  "send_pre_service_instructions",
  "notify_on_the_way",
  "request_review",
  "request_referral"
]);

const mappedToolName = Array.isArray(toolRegistry.mapped_tool_names)
  ? toolRegistry.mapped_tool_names.find(Boolean)
  : null;

const preliminaryAction =
  executionContext.action ||
  decision?.action ||
  $json.action ||
  null;

const emittedMessage = Boolean(
  $json.message ||
  $json.message_to_send ||
  $json.meta?.bot
);

const actionToolDefaults = {
  send_quote: "quote.create",
  offer_available_slots: "calendar.availability",
  confirm_booking: "calendar.create_booking",
  cancel_booking: "calendar.cancel_booking",
  reschedule_booking: "calendar.reschedule_booking",
  schedule_followup: "followup.schedule",
  request_review: "review.request",
  request_referral: "referral.request",
  handoff_human: "handoff.create"
};

const toolName =
  executionContext.tool_name ||
  toolRegistry.tool_name ||
  mappedToolName ||
  actionToolDefaults[preliminaryAction] ||
  (emittedMessage || messageActions.has(preliminaryAction) ? "message.send" : null);
const executorRef =
  executionContext.executor_ref ||
  toolRegistry.executor_ref ||
  null;
const executorType =
  executionContext.executor_type ||
  toolRegistry.executor_type ||
  null;
const agentId =
  executionContext.agent_id ||
  toolRegistry.agent_id ||
  contextPacket.agent?.id ||
  contextPacket.routing?.agent_id ||
  null;
const organizationId =
  executionContext.organization_id ||
  toolRegistry.organization_id ||
  contextPacket.organization?.id ||
  contextPacket.routing?.organization_id ||
  null;
const toolResolutionMode =
  executionContext.tool_resolution_mode ||
  toolRegistry.mode ||
  "legacy";

const leadId =
  executionContext.lead_id ||
  $json.lead_id ||
  contextPacket.lead?.id ||
  contextPacket.state?.lead_id ||
  contextPacket.event?.lead_id ||
  originalInput.execution_context?.lead_id ||
  originalInput.lead_id ||
  originalInput.context_packet?.lead?.id ||
  originalInput.context_packet?.state?.lead_id ||
  null;

const channel =
  executionContext.channel ||
  $json.channel ||
  contextPacket.lead?.channel ||
  "whatsapp";

const action = preliminaryAction;

const inboundMessageId =
  executionContext.inbound_message_id ||
  contextPacket.conversation?.last_message_id ||
  contextPacket.event?.message_id ||
  originalInput.event?.message_id ||
  $json.execution_meta?.execution_id ||
  originalInput.execution_meta?.execution_id ||
  Date.now().toString();

const computedIdempotencyKey =
  leadId && inboundMessageId && action
    ? `${leadId}__${inboundMessageId}__${action}`
    : null;

const idempotencyKey =
  computedIdempotencyKey ||
  executionContext.idempotency_key ||
  $json.idempotency_key ||
  (leadId && action ? `${leadId}__${Date.now().toString()}__${action}` : null);

if (!leadId) throw new Error("Missing lead_id for audit");

const finalDecision =
  decision && decision.action
    ? decision
    : {
        action: action || executionContext.action || null,
        reason: "missing_decision_fallback",
        message:
          $json.message ||
          $json.message_to_send ||
          $json.execution_result?.bot ||
          null,
        confidence: 0,
        source: "action_executor",
        state_update: $json.state_update || $json.lead_state_update || {},
      };

if (!finalDecision.action) throw new Error("Missing decision.action for audit");
if (!idempotencyKey) throw new Error("Missing idempotency_key for audit");

const botMessage =
  $json.message ||
  $json.message_to_send ||
  $json.execution_result?.bot ||
  $json.execution_result?.message ||
  null;

const messageSent = $json.message_sent === true;
const outboundMessageId =
  $json.outbound_message_id ||
  $json.message_id ||
  $json.message_db_id ||
  null;

const providerStatus =
  $json.provider_status ||
  ($json.message_sent === true ? "sent" : "failed");

const providerMessageId =
  $json.provider_message_id ||
  null;

return [{
  ...$json,
  flow_name: "action_executor",
  lead_id: leadId,
  inbound_message_id: inboundMessageId,
  outbound_message_id: outboundMessageId,
  provider_status: providerStatus,
  provider_message_id: providerMessageId,
  channel,
  stage_before: contextPacket.state?.stage || null,
  latest_user_message: contextPacket.conversation?.latest_user_message || null,
  allowed_actions: contextPacket.allowed_actions || [],
  decision: finalDecision,
  llm: null,
  idempotency_key: idempotencyKey,
  tool_name: toolName,
  executor_ref: executorRef,
  agent_id: agentId,
  organization_id: organizationId,

  execution_context: {
    ...executionContext,
    lead_id: leadId,
    channel,
    action,
    inbound_message_id: inboundMessageId,
    idempotency_key: idempotencyKey,
    tool_name: toolName,
    executor_ref: executorRef,
    executor_type: executorType,
    agent_id: agentId,
    organization_id: organizationId,
    tool_resolution_mode: toolResolutionMode
  },

  context_packet: contextPacket,

  meta: {
    execution_meta: $json.execution_meta || null,
    validation: {
      ...($json.validation || {}),
      requirements_ok:
        typeof $json.validation?.requirements_ok === "boolean"
          ? $json.validation.requirements_ok
          : true,
      required_fields: Array.isArray($json.validation?.required_fields)
        ? $json.validation.required_fields
        : [],
      missing_fields: Array.isArray($json.validation?.missing_fields)
        ? $json.validation.missing_fields
        : []
    },
    tool_name: toolName,
    executor_ref: executorRef,
    agent_id: agentId,
    organization_id: organizationId,
    tool_registry: {
      mode: toolResolutionMode,
      tool_name: toolName,
      executor_type: executorType,
      executor_ref: executorRef,
      agent_id: agentId,
      organization_id: organizationId,
      side_effect_level: toolRegistry.side_effect_level || null,
      mapped_tool_names: Array.isArray(toolRegistry.mapped_tool_names) && toolRegistry.mapped_tool_names.length > 0
        ? toolRegistry.mapped_tool_names
        : (toolName ? [toolName] : []),
      tool_chain: Array.isArray(toolRegistry.tool_chain)
        ? toolRegistry.tool_chain
        : []
    },
    action,
    state: {
      before: contextPacket.state || null,
      proposed_update: $json.proposed_state_update || finalDecision.state_update || null,
      sanitized_update: $json.sanitized_state_update || $json.state_update || null,
      current: $json.persisted_state_current || $json.state?.current || null,
    },
    outcome: $json.outcome || $json.execution_result?.outcome || null,
    handoff: action === "handoff_human" ? {
      human_handoff: true,
      handoff_case_id: $json.handoff_case_id || null,
      assigned_to: $json.assigned_to || null,
      assigned_team: $json.assigned_team || null,
      notification_sent: $json.notification_sent === true,
      notification_channel: $json.notification_channel || null,
      notification_sent_at: $json.notification_sent_at || null
    } : null,
    last_bot_action:
      $json.state_update?.last_bot_action ||
      $json.lead_state_update?.last_bot_action ||
      null,
    bot: botMessage,
    message_sent: messageSent,
    provider_message_id: providerMessageId,
    provider_status: providerStatus,
    outbound_message_id: outboundMessageId,
    outbound_message_saved: $json.outbound_message_saved === true,
    state_updated: $json.state_updated === true,
    db_records_created: $json.records || $json.db_operations || [],
    execution_result: $json.execution_result || null,
    notes: $json.notes || []
  },

  created_at: new Date().toISOString()
}];
