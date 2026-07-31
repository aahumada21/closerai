// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        extract_context
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================


const input = $json;

const event = parseMaybeJson(input.event, {});
const lead = parseMaybeJson(input.lead, {});
const leadState = parseMaybeJson(input.lead_state, {});
const memory = parseMaybeJson(input.memory, {});
const businessRules = parseMaybeJson(input.business_rules, {});
const organization = parseMaybeJson(input.organization, {});
const agent = parseMaybeJson(input.agent, {});
const agentBusinessConfig = parseMaybeJson(input.agent_business_config, {});
const agentRules = parseMaybeJson(input.agent_rules, []);
const agentTools = parseMaybeJson(input.agent_tools, []);
const routing = parseMaybeJson(input.routing, {});

function safeString(value) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function parseMaybeJson(value, fallback) {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

const normalizedEvent = {
  ...safeObject(event),
  channel: safeString(event.channel) ?? 'whatsapp',
  message_id: safeString(event.message_id),
  timestamp: safeString(event.timestamp),
  text: safeString(event.text),
  message_type: safeString(event.message_type) ?? 'text',
  attachments: safeArray(event.attachments),
  source_metadata: safeObject(event.source_metadata),
};

const normalizedLead = {
  ...safeObject(lead),
  id: safeString(lead.id),
  name: safeString(lead.name),
  channel: safeString(lead.channel) ?? normalizedEvent.channel ?? 'whatsapp',
  phone: safeString(lead.phone),
  external_id: safeString(lead.external_id),
};
const parsedBookingOptions = parseMaybeJson(leadState.booking_options, []);

const normalizedLeadState = {
  ...safeObject(leadState),
  lead_id: safeString(leadState.lead_id),
  stage: safeString(leadState.stage) ?? 'new_lead',
  intent_last: safeString(leadState.intent_last),
  interest_score: Number.isFinite(Number(leadState.interest_score))
    ? Number(leadState.interest_score)
    : 0,
  next_goal: safeString(leadState.next_goal) ?? 'identify_intent',
service_interest: safeString(leadState.service_interest),

vehicle_type: safeString(leadState.vehicle_type),
district: safeString(leadState.district),

mentioned_vehicle_type: safeString(leadState.mentioned_vehicle_type),
confirmed_vehicle_type: safeString(leadState.confirmed_vehicle_type || leadState.vehicle_type),

mentioned_district: safeString(leadState.mentioned_district),
confirmed_district: safeString(leadState.confirmed_district || leadState.district),
  missing_fields: safeArray(leadState.missing_fields),
  last_bot_action: safeString(leadState.last_bot_action),
  human_handoff: Boolean(leadState.human_handoff),
    booking_options: Array.isArray(parsedBookingOptions)
  ? parsedBookingOptions
  : [],

  booking_date: safeString(leadState.booking_date),
  booking_time: safeString(leadState.booking_time),
  slot_id: safeString(leadState.slot_id),
  service_address: safeString(leadState.service_address),
  address_reference: safeString(leadState.address_reference),
  address_confirmed:
    leadState.address_confirmed === true
      ? true
      : leadState.address_confirmed === false
        ? false
        : null,
  address_confirmed_at: safeString(leadState.address_confirmed_at),
  availability_confirmed:
    leadState.availability_confirmed === true
      ? true
      : leadState.availability_confirmed === false
        ? false
        : null,

  availability_window: safeString(leadState.availability_window),
  availability_label: safeString(leadState.availability_label),

  calendar_id: safeString(leadState.calendar_id),

  duration_minutes: Number.isFinite(Number(leadState.duration_minutes))
    ? Number(leadState.duration_minutes)
    : 120,

  days_ahead: Number.isFinite(Number(leadState.days_ahead))
    ? Number(leadState.days_ahead)
    : null,

  start_offset_days: Number.isFinite(Number(leadState.start_offset_days))
    ? Number(leadState.start_offset_days)
    : null,

  max_slots: Number.isFinite(Number(leadState.max_slots))
    ? Number(leadState.max_slots)
    : null,
  
};

const normalizedMemory = {
  ...safeObject(memory),
  short_summary: safeString(memory.short_summary),
  commercial_flags: safeArray(memory.commercial_flags),
  last_quote: memory.last_quote ?? null,
  last_appointment: memory.last_appointment ?? null,
};

const normalizedBusinessRules = {
  ...safeObject(businessRules),
  services: safeArray(businessRules.services),
  pricing_policy: safeString(businessRules.pricing_policy),
  district_policy: safeString(businessRules.district_policy),
  booking_policy: safeString(businessRules.booking_policy),
  currency: safeString(businessRules.currency) ?? 'CLP',
};

return [
  {
    json: {
      event: normalizedEvent,
      lead: normalizedLead,
      lead_state: normalizedLeadState,
      memory: normalizedMemory,
      business_rules: normalizedBusinessRules,
      organization: safeObject(organization),
      agent: safeObject(agent),
      agent_business_config: safeObject(agentBusinessConfig),
      agent_rules: Array.isArray(agentRules) ? agentRules : [],
      agent_tools: Array.isArray(agentTools) ? agentTools : [],
      routing: safeObject(routing),
    },
  },
];
