// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_execution_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.context_packet || {};
const state = ctx.state || {};
const conversation = ctx.conversation || {};
const lead = ctx.lead || {};
const event = data.event || {};
const ruleContext = ctx.rule_context || {};
const stateUpdate = data.decision?.state_update || {};

const action = data.decision?.action || "unknown_action";
const message =
  data.decision?.message ||
  data.rule_result?.message ||
  data.context_packet?.rule_result?.message ||
  data.context_packet?.decision?.message ||
  "";

const leadId =
  lead.id ||
  state.lead_id ||
  data.lead?.id ||
  null;

const phone =
  lead.phone ||
  data.lead?.phone ||
  event.phone ||
  null;

const channel =
  lead.channel ||
  data.lead?.channel ||
  event.channel ||
  "whatsapp";

const inboundMessageId =
  conversation.last_message_id ||
  event.message_id ||
  data.message_id ||
  data.context_packet?.event?.message_id ||
  data.execution_meta?.execution_id ||
  "no_message_id";

if (!leadId) {
  throw new Error("Missing lead_id in execution context");
}

if (!action) {
  throw new Error("Missing action in execution context");
}

if (!inboundMessageId || inboundMessageId === "no_message_id") {
  throw new Error("Missing inbound message id for idempotency");
}

const idempotency_key = `${leadId}__${inboundMessageId}__${action}`;
function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTool(tool) {
  if (!tool || typeof tool !== "object") return null;

  return {
    tool_name: tool.tool_name || tool.name || null,
    executor_type: tool.executor_type || null,
    executor_ref: tool.executor_ref || null,
    required_fields: asArray(tool.required_fields),
    config: tool.config && typeof tool.config === "object" ? tool.config : {},
    side_effect_level: tool.side_effect_level || null,
    is_active: tool.is_active !== false,
    agent_id: tool.agent_id || ctx.agent?.id || ctx.routing?.agent_id || null,
    organization_id: tool.organization_id || ctx.organization?.id || ctx.routing?.organization_id || null,
  };
}

const actionToTools = {
  ask_missing_data: ["message.send"],
  answer_question: ["message.send"],
  answer_objection: ["message.send"],
  offer_booking: ["message.send"],
  send_service_menu: ["message.send"],
  recommend_service: ["message.send"],
  ask_payment_preference: ["message.send", "lead_state.update"],
  collect_address: ["message.send", "lead_state.update"],
  confirm_address: ["message.send", "lead_state.update"],
  send_pre_service_instructions: ["message.send"],
  notify_on_the_way: ["message.send"],
  request_review: ["review.request"],
  request_referral: ["referral.request"],
  send_quote: ["quote.create", "message.send"],
  offer_available_slots: ["calendar.availability"],
  confirm_booking: ["calendar.create_booking"],
  cancel_booking: ["calendar.cancel_booking"],
  reschedule_booking: ["calendar.reschedule_booking"],
  schedule_followup: ["followup.schedule"],
  handoff_human: ["handoff.create"],
};

const configuredTools = [
  ...asArray(ctx.agent_tools),
  ...asArray(ctx.tools),
]
  .map(normalizeTool)
  .filter((tool) => tool && tool.tool_name && tool.is_active);

const toolNamesForAction = actionToTools[action] || [];
const resolvedTools = toolNamesForAction
  .map((toolName) => configuredTools.find((tool) => tool.tool_name === toolName) || null)
  .filter(Boolean);
const primaryTool = resolvedTools[0] || null;
const primaryMappedToolName = primaryTool?.tool_name || toolNamesForAction[0] || null;
const toolResolutionMode = primaryTool ? "tools" : (primaryMappedToolName ? "mapped_legacy" : "legacy");
const organizationId =
  primaryTool?.organization_id ||
  ctx.organization?.id ||
  ctx.routing?.organization_id ||
  lead.organization_id ||
  state.organization_id ||
  null;
const agentId =
  primaryTool?.agent_id ||
  ctx.agent?.id ||
  ctx.routing?.agent_id ||
  lead.agent_id ||
  state.agent_id ||
  null;

const bookingDate = firstValue(
  stateUpdate.booking_date,
  state.booking_date,
  ruleContext.booking_candidate?.booking_date
);

const bookingTime = firstValue(
  stateUpdate.booking_time,
  state.booking_time,
  ruleContext.booking_candidate?.booking_time
);

const slotId = firstValue(
  stateUpdate.slot_id,
  state.slot_id,
  ruleContext.booking_candidate?.slot_id,
  bookingDate && bookingTime ? `${bookingDate}_${bookingTime}` : null
);

return [
  {
    ...data,
    tool_registry: {
      mode: toolResolutionMode,
      action,
      mapped_tool_names: toolNamesForAction,
      tool_name: primaryMappedToolName,
      executor_type: primaryTool?.executor_type || null,
      executor_ref: primaryTool?.executor_ref || null,
      required_fields: primaryTool?.required_fields || [],
      side_effect_level: primaryTool?.side_effect_level || null,
      agent_id: agentId,
      organization_id: organizationId,
      tool_chain: resolvedTools.map((tool) => ({
        tool_name: tool.tool_name,
        executor_type: tool.executor_type,
        executor_ref: tool.executor_ref,
        side_effect_level: tool.side_effect_level,
      })),
    },
    execution_context: {
      lead_id: leadId,
      phone,
      channel,
      action,
      message,
      state_update: stateUpdate,
      inbound_message_id: inboundMessageId,
      idempotency_key,
      organization_id: organizationId,
      agent_id: agentId,
      tool_resolution_mode: toolResolutionMode,
      tool_name: primaryMappedToolName,
      executor_type: primaryTool?.executor_type || null,
      executor_ref: primaryTool?.executor_ref || null,
      tool_chain: resolvedTools.map((tool) => tool.tool_name),
      chat_session_id:
        data.context_packet?.conversation?.chat_session_id ||
        data.context_packet?.lead?.chat_session_id ||
        data.context_packet?.source_metadata?.chat_session_id ||
        data.context_packet?.event?.source_metadata?.chat_session_id ||
        null,
      address: firstValue(
        stateUpdate.address,
        stateUpdate.service_address,
        state.service_address,
        ruleContext.address_candidate?.address,
        ctx.conversation?.latest_user_message
      ),
      
      address_reference: firstValue(
        stateUpdate.address_reference,
        state.address_reference,
        ruleContext.address_candidate?.address_reference
      ),
      service_interest: firstValue(
        stateUpdate.service_interest,
        state.service_interest
      ),

      service_scope: firstValue(
        stateUpdate.service_scope,
        state.service_scope
      ),

      vehicle_type: firstValue(
        stateUpdate.vehicle_type,
        state.vehicle_type
      ),

      district: firstValue(
        stateUpdate.district,
        state.district
      ),

      staff_id: firstValue(
        stateUpdate.staff_id,
        state.staff_id
      ),

      staff_name: firstValue(
        stateUpdate.staff_name,
        state.staff_name
      ),

      // Efimero: solo viaja en esta misma ejecucion (no tiene columna
      // propia en lead_state). Se resuelve de nuevo cada turno en rules_engine.
      schedule: Array.isArray(stateUpdate.schedule) ? stateUpdate.schedule : null,
      availability_window: firstValue(
        stateUpdate.availability_window,
        state.availability_window
      ),
      
      availability_label: firstValue(
        stateUpdate.availability_label,
        state.availability_label
      ),
      
      days_ahead: firstValue(
        stateUpdate.days_ahead,
        state.days_ahead
      ),
      
      start_offset_days: firstValue(
        stateUpdate.start_offset_days,
        state.start_offset_days
      ),
      
      max_slots: firstValue(
        stateUpdate.max_slots,
        state.max_slots
      ),

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,

      availability_confirmed:
        stateUpdate.availability_confirmed ??
        state.availability_confirmed ??
        ruleContext.booking_candidate?.availability_confirmed ??
        (action === "confirm_booking" ? true : null),

      duration_minutes:
        stateUpdate.duration_minutes ||
        state.duration_minutes ||
        120,

      // Cada agente (numero) puede tener su propio Google Calendar via
      // agent_business_config.config.calendar_id. El hardcode queda solo
      // como ultimo fallback para no romper agentes sin calendario propio.
      // Sin fallback hardcodeado a proposito: si no hay calendario propio,
      // queda null y 6.2/6.3/6.4 cortan el flujo. Antes esto apuntaba al
      // calendario real de otro cliente. Ver docs/arquitectura/AISLAMIENTO_CALENDARIO.md
      calendar_id:
        state.calendar_id ||
        ctx.agent_business_config?.config?.calendar_id ||
        null,

      auto_offer_slots_after_cancel: stateUpdate.auto_offer_slots_after_cancel === true,

      followup_type:
        data.decision?.followup_type ||
        stateUpdate.followup_type ||
        state.followup_type ||
        null,

      scheduled_for:
        data.decision?.scheduled_for ||
        stateUpdate.scheduled_for ||
        state.scheduled_for ||
        null,
      cancellation_reason: firstValue(
        data.decision?.cancellation_reason,
        stateUpdate.cancellation_reason,
        ruleContext.cancellation_reason
      ),
            reschedule_reason: firstValue(
        data.decision?.reschedule_reason,
        stateUpdate.reschedule_reason,
        ruleContext.reschedule_reason
      ),
      payment_preference: firstValue(
        stateUpdate.payment_preference,
        state.payment_preference
      ),
      payment_mode: firstValue(
        stateUpdate.payment_mode,
        state.payment_mode,
        ctx.agent_business_config?.config?.payment_mode
      ) || "both",
      handoff_reason: data.decision?.reason || null,
      handoff_summary:
        ctx.conversation?.short_summary ||
        ctx.conversation?.latest_user_message ||
        null,
    },
  },
];
