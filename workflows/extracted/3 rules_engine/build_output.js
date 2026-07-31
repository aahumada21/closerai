// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        build_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json.event ?? {};
const lead = $json.lead ?? {};
const leadState = $json.lead_state ?? {};
const ruleResult = $json.rule_result ?? {};
const memory = $json.memory ?? {};
const businessRules = $json.business_rules ?? {};
const organization = $json.organization ?? {};
const agentBusinessConfig = $json.agent_business_config ?? {};
const agent = $json.agent ?? {};
const agentRules = Array.isArray($json.agent_rules) ? $json.agent_rules : [];
const agentTools = Array.isArray($json.agent_tools) ? $json.agent_tools : [];
const routing = $json.routing ?? {};
const ruleTrace = Array.isArray($json.rule_trace) ? $json.rule_trace : [];
const configUsed = $json.config_used ?? {};
const incomingMeta = $json.meta ?? {};

const shouldCallLlm = Boolean(ruleResult.should_call_llm);

const shouldCallActionExecutor =
  shouldCallLlm === false &&
  !!ruleResult.action &&
  ruleResult.action !== 'ignore';

const shouldStop =
  shouldCallLlm === false &&
  (!ruleResult.action || ruleResult.action === 'ignore');

const actionsThatBuildMessageInExecutor = [
  "send_quote",
  "offer_available_slots",
  "confirm_booking",
  "cancel_booking",
  "reschedule_booking",
  "confirm_address",
  "send_service_menu",
  "recommend_service",
  "ask_payment_preference",
  "check_payment_status"
];

const requiresMessageBuilder =
  actionsThatBuildMessageInExecutor.includes(ruleResult.action);

if (
  shouldCallActionExecutor &&
  !requiresMessageBuilder &&
  !String(ruleResult.message || "").trim()
) {
  throw new Error(
    `rules_engine action ${ruleResult.action} requires message but message is empty`
  );
}

const decision =
  shouldCallActionExecutor
    ? {
        action: ruleResult.action ?? null,
        reason: ruleResult.reason ?? null,
        message: String(ruleResult.message || "").trim() || null,
        state_update: ruleResult.state_update ?? {},
        source: "rules_engine",
        rule_name: ruleResult.rule_name ?? null,
        requires_message_builder: requiresMessageBuilder
      }
    : null;

return [
  {
    json: {
      event: {
        channel: event.channel ?? null,
        message_id: event.message_id ?? null,
        timestamp: event.timestamp ?? null,
        text: event.text ?? null,
        message_type: event.message_type ?? 'text',
        attachments: Array.isArray(event.attachments) ? event.attachments : [],
        source_metadata: event.source_metadata ?? {},
      },
      lead: {
        id: lead.id ?? null,
        name: lead.name ?? null,
        channel: lead.channel ?? null,
        phone: lead.phone ?? null,
        external_id: lead.external_id ?? null,
      },
      lead_state: {
        lead_id: leadState.lead_id ?? null,
        stage: leadState.stage ?? 'new_lead',
        intent_last: leadState.intent_last ?? null,
        interest_score: Number.isFinite(Number(leadState.interest_score))
          ? Number(leadState.interest_score)
          : 0,
        next_goal: leadState.next_goal ?? 'identify_intent',
        service_interest: leadState.service_interest ?? null,
        vehicle_type: leadState.vehicle_type ?? null,
        district: leadState.district ?? null,
        missing_fields: Array.isArray(leadState.missing_fields)
          ? leadState.missing_fields
          : [],
        last_bot_action: leadState.last_bot_action ?? null,
        human_handoff: Boolean(leadState.human_handoff),
                booking_options: Array.isArray(leadState.booking_options)
          ? leadState.booking_options
          : [],

        booking_date: leadState.booking_date ?? null,
        booking_time: leadState.booking_time ?? null,
        slot_id: leadState.slot_id ?? null,
        service_address: leadState.service_address ?? null,
        address_reference: leadState.address_reference ?? null,
        address_confirmed:
          leadState.address_confirmed === true
            ? true
            : leadState.address_confirmed === false
              ? false
              : null,
        address_confirmed_at: leadState.address_confirmed_at ?? null,

        availability_confirmed:
          leadState.availability_confirmed === true
            ? true
            : leadState.availability_confirmed === false
              ? false
              : null,

        availability_window: leadState.availability_window ?? null,
        availability_label: leadState.availability_label ?? null,
        calendar_id: leadState.calendar_id ?? null,
        duration_minutes: leadState.duration_minutes ?? 120,
        days_ahead: leadState.days_ahead ?? null,
        start_offset_days: leadState.start_offset_days ?? null,
        max_slots: leadState.max_slots ?? null,

        agent_id: leadState.agent_id ?? agent?.id ?? null,
        organization_id: leadState.organization_id ?? organization?.id ?? null,
        payment_preference: leadState.payment_preference ?? null,
        payment_status: leadState.payment_status ?? null,
        flow_order_id: leadState.flow_order_id ?? null,
        flow_payment_url: leadState.flow_payment_url ?? null,
        payment_mode: leadState.payment_mode ?? null,
        selected_slot: leadState.selected_slot ?? null,
        selected_booking_option: leadState.selected_booking_option ?? null,
        slot_start_at: leadState.slot_start_at ?? null,
        slot_end_at: leadState.slot_end_at ?? null,
        quoted_price: leadState.quoted_price ?? null,
        quoted_service: leadState.quoted_service ?? null,
      },
      rule_result: {
        resolution_type: ruleResult.resolution_type ?? 'send_to_llm',
        action: ruleResult.action ?? null,
        reason: ruleResult.reason ?? 'needs_commercial_interpretation',
        message: ruleResult.message ?? null,
        missing_fields: Array.isArray(ruleResult.missing_fields)
          ? ruleResult.missing_fields
          : [],
        should_call_llm: shouldCallLlm,
        state_update: ruleResult.state_update ?? {},
        rule_name: ruleResult.rule_name ?? null,
        priority: Number.isFinite(Number(ruleResult.priority))
          ? Number(ruleResult.priority)
          : null,
      },
      decision,
      route: {
        should_call_llm: shouldCallLlm,
        should_call_action_executor: shouldCallActionExecutor,
        should_stop: shouldStop,
      },
      memory: {
        short_summary: memory.short_summary ?? '',
        commercial_flags: Array.isArray(memory.commercial_flags)
          ? memory.commercial_flags
          : [],
        last_quote: memory.last_quote ?? null,
        last_appointment: memory.last_appointment ?? null,
      },
      business_rules: {
        services: Array.isArray(businessRules.services) ? businessRules.services : [],
        pricing_policy: businessRules.pricing_policy ?? '',
        district_policy: businessRules.district_policy ?? '',
        booking_policy: businessRules.booking_policy ?? '',
        currency: businessRules.currency ?? 'CLP',
      },
      organization,
      agent,
      agent_business_config: agentBusinessConfig,
      agent_rules: agentRules,
      agent_tools: agentTools,
      routing,
      rule_trace: ruleTrace,
      config_used: configUsed,
      meta: {
        ...incomingMeta,
        workflow: 'rules_engine',
        version: '2.0.0',
        ruleset_version: '2.1.0',
        config_used: configUsed,
      },
    },
  },
];
