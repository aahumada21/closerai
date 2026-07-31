// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        build_rule_decision_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function asObject(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const input = $json;

const event = asObject(input.event);
const lead = asObject(input.lead);
const leadState = asObject(input.lead_state);
const memory = asObject(input.memory);
const businessRules = asObject(input.business_rules);
const ruleResult = asObject(input.rule_result);
const existingContext = asObject(input.context_packet);
const meta = asObject(input.meta);
const organization = asObject(input.organization || existingContext.organization);
const agent = asObject(input.agent || existingContext.agent);
const agentBusinessConfig = asObject(input.agent_business_config || existingContext.agent_business_config);
const agentBusiness = asObject(agentBusinessConfig.config || agentBusinessConfig);
const agentRules = Array.isArray(input.agent_rules) ? input.agent_rules : (Array.isArray(existingContext.agent_rules) ? existingContext.agent_rules : []);
const agentTools = Array.isArray(input.agent_tools) ? input.agent_tools : (Array.isArray(existingContext.agent_tools) ? existingContext.agent_tools : []);
const routing = asObject(input.routing || existingContext.routing);

function hasKeys(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

const existingBusiness = asObject(existingContext.business);
const resolvedBusiness = {
  ...businessRules,
  ...agentBusiness,
  ...existingBusiness
};

const existingServices = Array.isArray(existingBusiness.services) ? existingBusiness.services : [];
const agentServices = Array.isArray(agentBusiness.services) ? agentBusiness.services : [];
const ruleServices = Array.isArray(businessRules.services) ? businessRules.services : [];
resolvedBusiness.services = existingServices.length > 0
  ? existingServices
  : (agentServices.length > 0 ? agentServices : ruleServices);

if (!resolvedBusiness.business_name) {
  resolvedBusiness.business_name =
    organization.name ||
    agent.name ||
    businessRules.business_name ||
    null;
}

const organizationId =
  routing.organization_id ||
  organization.id ||
  agent.organization_id ||
  lead.organization_id ||
  leadState.organization_id ||
  null;

const agentId =
  routing.agent_id ||
  agent.id ||
  lead.agent_id ||
  leadState.agent_id ||
  null;

const action =
  ruleResult.action ||
  input.decision?.action ||
  null;

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
  actionsThatBuildMessageInExecutor.includes(action);

const decisionMessage =
  typeof ruleResult.message === "string"
    ? ruleResult.message.trim()
    : "";

if (!action) {
  throw new Error("build_rule_decision_payload: missing rule action");
}

if (!decisionMessage && !requiresMessageBuilder) {
  throw new Error(
    `build_rule_decision_payload: action ${action} requires message but message is empty`
  );
}

const stateUpdate = asObject(ruleResult.state_update);

const decision = {
  action,
  reason: ruleResult.reason || input.decision?.reason || null,
  message: decisionMessage || null,
  state_update: {
    ...stateUpdate,
    last_bot_action: stateUpdate.last_bot_action || action
  },
  confidence: 1,
  source: "rules_engine",
  rule_name: ruleResult.rule_name || null,
  requires_message_builder: requiresMessageBuilder
};

const leadId =
  existingContext.lead?.id ||
  lead.id ||
  leadState.lead_id ||
  null;

const phone =
  existingContext.lead?.phone ||
  lead.phone ||
  lead.external_id ||
  null;

const channel =
  existingContext.lead?.channel ||
  lead.channel ||
  event.channel ||
  "whatsapp";

const inboundMessageId =
  existingContext.conversation?.last_message_id ||
  event.message_id ||
  input.message_id ||
  null;

const contextPacket = {
  ...existingContext,

  lead: {
    ...(existingContext.lead || {}),
    id: leadId,
    name: existingContext.lead?.name || lead.name || null,
    phone,
    channel,
    external_id:
      existingContext.lead?.external_id ||
      lead.external_id ||
      phone ||
      null,
    organization_id: existingContext.lead?.organization_id || lead.organization_id || organizationId,
    agent_id: existingContext.lead?.agent_id || lead.agent_id || agentId
  },

  state: {
    ...(existingContext.state || {}),
    ...leadState,
    ...decision.state_update,
    lead_id: leadState.lead_id || leadId,
    organization_id: existingContext.state?.organization_id || leadState.organization_id || organizationId,
    agent_id: existingContext.state?.agent_id || leadState.agent_id || agentId
  },

  conversation: {
    ...(existingContext.conversation || {}),
    latest_user_message:
      existingContext.conversation?.latest_user_message ||
      event.text ||
      null,
    short_summary:
      existingContext.conversation?.short_summary ||
      memory.short_summary ||
      event.text ||
      "",
    last_message_id: inboundMessageId
  },

  organization: hasKeys(existingContext.organization) ? existingContext.organization : organization,

  agent: hasKeys(existingContext.agent) ? existingContext.agent : agent,

  agent_business_config: hasKeys(existingContext.agent_business_config)
    ? existingContext.agent_business_config
    : agentBusinessConfig,

  business: resolvedBusiness,

  tools: Array.isArray(existingContext.tools) ? existingContext.tools : agentTools,
  agent_tools: Array.isArray(existingContext.agent_tools) ? existingContext.agent_tools : agentTools,
  agent_rules: Array.isArray(existingContext.agent_rules) ? existingContext.agent_rules : agentRules,
  routing: {
    ...(existingContext.routing || {}),
    ...routing,
    organization_id: organizationId,
    agent_id: agentId
  },

  allowed_actions: Array.from(
    new Set([
      ...(Array.isArray(existingContext.allowed_actions)
        ? existingContext.allowed_actions
        : []),
      action
    ].filter(Boolean))
  )
};

return [
  {
    json: {
      event,
      lead: {
        ...lead,
        id: leadId,
        phone,
        channel,
        external_id: lead.external_id || phone,
        organization_id: lead.organization_id || organizationId,
        agent_id: lead.agent_id || agentId
      },
      lead_state: {
        ...leadState,
        ...decision.state_update,
        lead_id: leadState.lead_id || leadId,
        organization_id: leadState.organization_id || organizationId,
        agent_id: leadState.agent_id || agentId
      },
      decision,
      context_packet: contextPacket,
      rule_result: ruleResult,
      memory,
      business_rules: businessRules,
      organization,
      agent,
      agent_business_config: agentBusinessConfig,
      agent_rules: agentRules,
      agent_tools: agentTools,
      routing: {
        ...routing,
        organization_id: organizationId,
        agent_id: agentId
      },
      meta: {
        ...meta,
        source: "rules_engine",
        route: "rule_based_to_action_executor",
        inbound_message_id: inboundMessageId,
        organization_id: organizationId,
        agent_id: agentId,
        requires_message_builder: requiresMessageBuilder
      }
    }
  }
];
