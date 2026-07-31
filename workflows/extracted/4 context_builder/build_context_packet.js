// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 4 context_builder  (workflow id 5f5ef274-4b7a-4a1a-b463-ff22e5eae55e)
// Nodo:        build_context_packet
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }
  return fallback;
}

function safeString(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length ? str : fallback;
}

function safeNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanArray(values) {
  if (!Array.isArray(values)) return [];
  const result = [];
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      result.push(value.trim());
    }
  }
  return [...new Set(result)];
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function compactObject(obj) {
  return Object.fromEntries(
    Object.entries(obj || {}).filter(([_, value]) => value !== undefined)
  );
}

function normalizeObject(value) {
  const parsed = parseJson(value, null);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}

function normalizeArray(value) {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed) ? parsed : [];
}

function hasObjectData(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function normalizeBusinessFromAgentConfig(agentBusinessConfig, businessRules) {
  const config = normalizeObject(agentBusinessConfig?.config) || normalizeObject(agentBusinessConfig) || null;
  const legacy = normalizeObject(businessRules) || {};

  if (hasObjectData(config)) {
    return {
      ...config,
      services: Array.isArray(config.services) ? config.services : [],
      service_aliases: normalizeObject(config.service_aliases) || {},
      coverage: normalizeObject(config.coverage) || {},
      pricing_policy: normalizeObject(config.pricing_policy) || config.pricing_policy || {},
      booking_policy: normalizeObject(config.booking_policy) || config.booking_policy || {},
      messages: normalizeObject(config.messages) || {},
      agent_limits: normalizeObject(config.agent_limits) || {},
      currency: safeString(config.currency, "CLP"),
      config_source: "agent_business_config"
    };
  }

  return {
    services: Array.isArray(legacy.services) ? legacy.services : [],
    pricing_policy: safeString(legacy.pricing_policy, ""),
    district_policy: safeString(legacy.district_policy, ""),
    booking_policy: safeString(legacy.booking_policy, ""),
    currency: safeString(legacy.currency, "CLP"),
    config_source: "legacy_business_rules"
  };
}

const raw = $json || {};

let triggerRaw = {};
try {
  triggerRaw = $("rules_engine").first().json || {};
} catch (e) {
  triggerRaw = {};
}

const source =
  raw.event || raw.lead || raw.lead_state || raw.context_packet
    ? raw
    : triggerRaw;

const contextPacketInput = parseJson(source.context_packet, {});

const event = parseJson(source.event, {});
const lead = parseJson(source.lead, {});
const leadStateInput = parseJson(source.lead_state, {});
const memory = parseJson(source.memory, {});
const businessRules = parseJson(source.business_rules, {});
const ruleResult = parseJson(source.rule_result, {});
const decision = parseJson(source.decision, {});
const route = parseJson(source.route, {});
const meta = parseJson(source.meta, {});

const organization = normalizeObject(source.organization) || normalizeObject(contextPacketInput.organization) || null;
const agent = normalizeObject(source.agent) || normalizeObject(contextPacketInput.agent) || null;
const agentBusinessConfig = normalizeObject(source.agent_business_config) || normalizeObject(contextPacketInput.agent_business_config) || null;
const agentRules = normalizeArray(source.agent_rules?.length ? source.agent_rules : contextPacketInput.agent_rules);
const agentTools = normalizeArray(source.agent_tools?.length ? source.agent_tools : contextPacketInput.tools || contextPacketInput.agent_tools);
const knowledgeChunks = normalizeArray(raw.knowledge_chunks || source.knowledge_chunks || contextPacketInput.knowledge?.chunks);
const knowledgeSourceIds = normalizeArray(raw.knowledge_source_ids || source.knowledge_source_ids || contextPacketInput.knowledge?.source_ids);
const knowledgeRetrievalOk = raw.retrieval_ok === true || source.retrieval_ok === true || contextPacketInput.knowledge?.retrieval_ok === true;
const channelConfig = normalizeObject(source.channel_config) || normalizeObject(contextPacketInput.channel_config) || null;
const routingInput = normalizeObject(source.routing) || normalizeObject(contextPacketInput.routing) || {};
const business = normalizeBusinessFromAgentConfig(agentBusinessConfig, businessRules);

const leadId = firstValue(
  lead.id,
  lead.lead_id,
  leadStateInput.lead_id,
  contextPacketInput.lead?.id,
  contextPacketInput.state?.lead_id
);

const phone = firstValue(
  lead.phone,
  lead.external_id,
  contextPacketInput.lead?.phone,
  contextPacketInput.lead?.external_id
);

const channel = firstValue(
  lead.channel,
  event.channel,
  contextPacketInput.lead?.channel,
  "whatsapp"
);

if (!leadId) throw new Error("context_builder missing lead_id");
if (!phone) throw new Error("context_builder missing phone");

const missingFields = cleanArray(
  ruleResult.missing_fields?.length
    ? ruleResult.missing_fields
    : leadStateInput.missing_fields
);

const state = compactObject({
  ...leadStateInput,
  lead_id: leadStateInput.lead_id || leadId,
  organization_id: firstValue(leadStateInput.organization_id, lead.organization_id, organization?.id, routingInput.organization_id),
  agent_id: firstValue(leadStateInput.agent_id, lead.agent_id, agent?.id, routingInput.agent_id),
  stage: safeString(leadStateInput.stage, "new_lead"),
  intent_last: safeString(leadStateInput.intent_last),
  interest_score: safeNumber(leadStateInput.interest_score, 0),
  next_goal: safeString(leadStateInput.next_goal, "identify_intent"),
  service_interest: safeString(leadStateInput.service_interest),
  service_scope: safeString(leadStateInput.service_scope),
  vehicle_type: safeString(leadStateInput.confirmed_vehicle_type || leadStateInput.vehicle_type),
  district: safeString(leadStateInput.confirmed_district || leadStateInput.district),
  mentioned_vehicle_type: safeString(leadStateInput.mentioned_vehicle_type),
  confirmed_vehicle_type: safeString(leadStateInput.confirmed_vehicle_type || leadStateInput.vehicle_type),
  mentioned_district: safeString(leadStateInput.mentioned_district),
  confirmed_district: safeString(leadStateInput.confirmed_district || leadStateInput.district),
  missing_fields: missingFields,
  last_bot_action: safeString(leadStateInput.last_bot_action),
  human_handoff: leadStateInput.human_handoff === true,
  booking_options: Array.isArray(leadStateInput.booking_options) ? leadStateInput.booking_options : parseJson(leadStateInput.booking_options, []),
  booking_date: safeString(leadStateInput.booking_date),
  booking_time: safeString(leadStateInput.booking_time),
  slot_id: safeString(leadStateInput.slot_id),
  availability_confirmed: leadStateInput.availability_confirmed === true ? true : leadStateInput.availability_confirmed === false ? false : null,
  availability_window: safeString(leadStateInput.availability_window),
  availability_label: safeString(leadStateInput.availability_label),
  days_ahead: safeNumber(leadStateInput.days_ahead),
  start_offset_days: safeNumber(leadStateInput.start_offset_days),
  max_slots: safeNumber(leadStateInput.max_slots, business.booking_policy?.max_slots_default),
  duration_minutes: safeNumber(leadStateInput.duration_minutes, business.booking_policy?.duration_minutes_default || 120),
  calendar_id: safeString(leadStateInput.calendar_id),
  service_address: safeString(leadStateInput.service_address),
  address: safeString(leadStateInput.address),
  address_reference: safeString(leadStateInput.address_reference),
  address_confirmed: leadStateInput.address_confirmed === true ? true : leadStateInput.address_confirmed === false ? false : null,
  followup_type: safeString(leadStateInput.followup_type),
  scheduled_for: safeString(leadStateInput.scheduled_for),
  payment_preference: safeString(leadStateInput.payment_preference),
  payment_status: safeString(leadStateInput.payment_status),
  flow_order_id: safeString(leadStateInput.flow_order_id),
  flow_payment_url: safeString(leadStateInput.flow_payment_url),
  payment_mode: safeString(leadStateInput.payment_mode),
  quoted_price: safeNumber(leadStateInput.quoted_price),
  quoted_service: safeString(leadStateInput.quoted_service),
});

const stage = state.stage || "new_lead";
const hasService = !!state.service_interest;
const hasDistrict = !!state.district;
const hasVehicle = !!state.vehicle_type;
const hasBookingDate = !!state.booking_date;
const hasBookingTime = !!state.booking_time;
const hasSlot = !!state.slot_id || (hasBookingDate && hasBookingTime);
const hasBookingOptions = Array.isArray(state.booking_options) && state.booking_options.length > 0;
const hasBookingCandidate = hasSlot || hasBookingOptions;
const hasAddress = !!(state.service_address || state.address || state.address_reference || state.address_confirmed === true);
const activeAppointment = memory.last_appointment || null;
const hasActiveAppointment = !!(activeAppointment && ["confirmed", "pending", "booked"].includes(String(activeAppointment.status || "").toLowerCase()));
const isHandoffLocked = state.human_handoff === true || stage === "human_handoff";

const SUPPORTED_ACTIONS = ["ask_missing_data", "send_quote", "answer_question", "answer_objection", "offer_booking", "offer_available_slots", "confirm_booking", "schedule_followup", "handoff_human", "cancel_booking", "reschedule_booking", "collect_address", "confirm_address", "send_pre_service_instructions", "notify_on_the_way", "request_review", "request_referral", "send_service_menu", "recommend_service", "check_payment_status"];
const UNSUPPORTED_PRODUCT_ACTIONS_PENDING = [];
const ALLOWED_ACTIONS_BY_STAGE = {
  new_lead: ["send_service_menu", "recommend_service", "ask_missing_data", "answer_question", "send_quote", "offer_available_slots", "handoff_human"],
  service_discovery: ["send_service_menu", "recommend_service", "ask_missing_data", "send_quote", "offer_available_slots", "answer_question", "handoff_human"],
  qualified: ["send_service_menu", "recommend_service", "send_quote", "offer_available_slots", "answer_question", "answer_objection", "offer_booking", "handoff_human"],
  quoted: ["answer_objection", "schedule_followup", "offer_available_slots", "collect_address", "answer_question", "offer_booking", "handoff_human"],
  objection: ["answer_objection", "offer_available_slots", "answer_question", "offer_booking", "handoff_human"],
  closing: ["offer_available_slots", "schedule_followup", "collect_address", "answer_question", "answer_objection", "offer_booking", "handoff_human"],
  booking_selection: ["confirm_booking", "collect_address", "offer_available_slots", "reschedule_booking", "answer_question", "handoff_human"],
  collecting_address: ["confirm_address", "collect_address", "answer_question", "handoff_human"],
  address_confirmation: ["confirm_address", "confirm_booking", "collect_address", "answer_question", "handoff_human"],
  booked: ["cancel_booking", "reschedule_booking", "send_pre_service_instructions", "notify_on_the_way", "answer_question", "handoff_human"],
  cancelling: ["cancel_booking", "answer_question", "handoff_human"],
  reschedule: ["reschedule_booking", "offer_available_slots", "answer_question", "handoff_human"],
  post_service: ["request_review", "request_referral", "answer_question", "handoff_human"],
  reactivation: ["send_quote", "offer_available_slots", "answer_question", "schedule_followup", "handoff_human"],
  lost: ["schedule_followup", "handoff_human"],
  human_handoff: [],
};

function actionRequirements(action) {
  const map = {
    ask_missing_data: [], send_service_menu: [], recommend_service: [], answer_question: [], answer_objection: [], offer_booking: ["service_interest"],
    send_quote: ["service_interest", "vehicle_type", "district"], offer_available_slots: ["service_interest", "vehicle_type", "district"],
    confirm_booking: ["service_interest", "vehicle_type", "district", "booking_date", "booking_time", "address"], collect_address: ["booking_candidate"], confirm_address: ["address_candidate"],
    cancel_booking: [], reschedule_booking: [], send_pre_service_instructions: [], notify_on_the_way: [], request_review: [], request_referral: [], schedule_followup: ["followup_type", "scheduled_for"], handoff_human: []
  };
  return map[action] || [];
}

function missingForAction(action) {
  return actionRequirements(action).filter((field) => {
    if (field === "service_interest") return !hasService;
    if (field === "vehicle_type") return !hasVehicle;
    if (field === "district") return !hasDistrict;
    if (field === "booking_date") return !hasBookingDate;
    if (field === "booking_time") return !hasBookingTime;
    if (field === "address") return !hasAddress;
    if (field === "booking_candidate") return !hasBookingCandidate;
    if (field === "address_candidate") return !hasAddress && !safeString(event.text);
    if (field === "followup_type") return !state.followup_type;
    if (field === "scheduled_for") return !state.scheduled_for;
    return false;
  });
}

function canRunAction(action) {
  if (!SUPPORTED_ACTIONS.includes(action)) return false;
  if (isHandoffLocked) return false;
  if (action === "confirm_booking" && !hasAddress) return false;
  if (["send_quote", "offer_available_slots"].includes(action)) return hasService && hasVehicle && hasDistrict;
  if (action === "confirm_booking") return hasService && hasVehicle && hasDistrict && hasBookingDate && hasBookingTime && hasAddress;
  if (action === "collect_address") return hasBookingCandidate || ["quoted", "closing", "booking_selection", "booking_confirmation"].includes(stage);
  if (action === "confirm_address") return hasAddress || ["collecting_address", "address_confirmation"].includes(stage);
  if (["cancel_booking", "reschedule_booking"].includes(action)) return true;
  if (["send_pre_service_instructions", "notify_on_the_way"].includes(action)) return hasActiveAppointment || stage === "booked";
  if (["request_review", "request_referral"].includes(action)) {
    const ruleAction = safeString(ruleResult.action);
    return stage === "post_service" || ruleAction === "request_review" || ruleAction === "request_referral";
  }
  if (action === "schedule_followup") return !!state.followup_type && !!state.scheduled_for;
  return true;
}

function buildAllowedActions() {
  if (isHandoffLocked) return [];
  const ruleAction = safeString(ruleResult.action);
  if (ruleAction) return SUPPORTED_ACTIONS.includes(ruleAction) ? [ruleAction] : [];
  let candidates = ALLOWED_ACTIONS_BY_STAGE[stage] || ALLOWED_ACTIONS_BY_STAGE.new_lead;
  if (missingFields.length > 0) candidates = ["send_service_menu", "recommend_service", "ask_missing_data", "answer_question", "handoff_human"];
  if (hasService && hasVehicle && hasDistrict) {
    candidates = unique(candidates).filter((action) => action !== "recommend_service");
    if (!["quoted", "closing", "booking_selection", "booking_confirmation", "collecting_address", "address_confirmation", "booked"].includes(stage)) candidates.unshift("send_quote");
    candidates.push("offer_available_slots", "answer_question", "offer_booking");
  }
  if (hasBookingDate && hasBookingTime && !hasAddress) {
    candidates = state.availability_confirmed === true ? ["collect_address", "answer_question", "handoff_human"] : ["offer_available_slots", "answer_question", "handoff_human"];
  }
  if (hasService && hasVehicle && hasDistrict && hasBookingDate && hasBookingTime && hasAddress) candidates.unshift("confirm_booking");
  if (hasActiveAppointment || stage === "booked") candidates.push("cancel_booking", "reschedule_booking", "send_pre_service_instructions", "notify_on_the_way");
  candidates = unique(candidates).filter((action) => SUPPORTED_ACTIONS.includes(action)).filter((action) => canRunAction(action));
  if (!candidates.includes("handoff_human")) candidates.push("handoff_human");
  return unique(candidates);
}

function normalizeForIntent(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

function userWantsCancel(rawText) {
  const t = normalizeForIntent(rawText);
  return t.includes("cancelar") || t.includes("cancela") || t.includes("cancelame") || t.includes("anular") || t.includes("anula") || t.includes("no voy a poder") || t.includes("no podre") || t.includes("no puedo asistir") || t.includes("no puedo ir");
}

function userWantsReschedule(rawText) {
  const t = normalizeForIntent(rawText);
  return t.includes("reagendar") || t.includes("reprogramar") || t.includes("cambiar la hora") || t.includes("cambiar hora") || t.includes("cambiar fecha") || t.includes("mover la hora") || t.includes("otra hora") || t.includes("otro horario") || t.includes("otro dia") || t.includes("otro da");
}

let allowedActions = buildAllowedActions();
const currentTextForPriority = safeString(event.text, "");
if (userWantsCancel(currentTextForPriority)) allowedActions = unique(["cancel_booking", ...allowedActions.filter((action) => action !== "cancel_booking")]);
if (userWantsReschedule(currentTextForPriority)) allowedActions = unique(["reschedule_booking", ...allowedActions.filter((action) => action !== "reschedule_booking")]);

const latestUserMessage = safeString(event.text, "");
const shortSummary = firstValue(memory.short_summary, contextPacketInput.conversation?.short_summary, latestUserMessage, "");

const contextPacket = {
  lead: {
    id: leadId,
    name: safeString(lead.name, "Cliente"),
    phone,
    channel,
    external_id: firstValue(lead.external_id, phone),
    organization_id: firstValue(lead.organization_id, organization?.id, routingInput.organization_id),
    agent_id: firstValue(lead.agent_id, agent?.id, routingInput.agent_id),
  },
  state,
  organization,
  agent,
  agent_business_config: agentBusinessConfig,
  business,
  tools: agentTools,
  knowledge: {
    chunks: knowledgeChunks,
    source_ids: knowledgeSourceIds,
    retrieval_ok: knowledgeRetrievalOk,
  },
  agent_rules: agentRules,
  channel_config: channelConfig,
  routing: {
    ...routingInput,
    organization_id: firstValue(routingInput.organization_id, organization?.id, lead.organization_id, state.organization_id),
    agent_id: firstValue(routingInput.agent_id, agent?.id, lead.agent_id, state.agent_id),
  },
  conversation: {
    message_type: safeString(event.message_type, "text"),
    latest_user_message: latestUserMessage,
    short_summary: shortSummary,
    last_message_id: safeString(event.message_id),
    chat_session_id: event.source_metadata?.chat_session_id || null,
  },
  source_metadata: { ...(event.source_metadata || {}) },
  rule_context: {
    rule_result: {
      resolution_type: safeString(ruleResult.resolution_type, "send_to_llm"),
      action: safeString(ruleResult.action),
      reason: safeString(ruleResult.reason),
      message: ruleResult.message ?? null,
      missing_fields: cleanArray(ruleResult.missing_fields),
      should_call_llm: ruleResult.should_call_llm === true,
      state_update: ruleResult.state_update || {},
      rule_name: safeString(ruleResult.rule_name),
      priority: safeNumber(ruleResult.priority),
    },
    decision_from_rules: decision || null,
    route: route || {},
  },
  context_hints: {
    has_missing_fields: missingFields.length > 0,
    missing_fields_count: missingFields.length,
    priority_missing_fields: missingFields,
    has_service: hasService,
    has_vehicle: hasVehicle,
    has_district: hasDistrict,
    has_booking_candidate: hasBookingCandidate,
    has_booking_options: hasBookingOptions,
    has_address: hasAddress,
    has_active_appointment: hasActiveAppointment,
    is_handoff_locked: isHandoffLocked,
    latest_message_present: !!latestUserMessage,
    has_short_summary: !!memory.short_summary,
    agent_context_loaded: !!agent?.id,
    business_config_source: business.config_source,
    knowledge_chunks_count: knowledgeChunks.length,
    knowledge_retrieval_ok: knowledgeRetrievalOk,
    stage_goal: {
      service_discovery: "identify_service_then_collect_vehicle_and_district",
      new_lead: "qualify_lead",
      qualified: "quote_or_offer_slots",
      quoted: "move_to_booking",
      objection: "handle_objection_then_book",
      closing: "book_appointment",
      booking_selection: "collect_slot_or_address",
      booking_confirmation: "confirm_booking_after_address",
      collecting_address: "collect_and_validate_address",
      address_confirmation: "validate_address_then_confirm_booking",
      booked: "manage_existing_booking",
      post_service: "review_and_referral",
      human_handoff: "human_takeover",
    }[stage] || "continue_conversation",
    action_requirements_missing: Object.fromEntries(allowedActions.map((action) => [action, missingForAction(action)])),
    unsupported_product_actions_pending: UNSUPPORTED_PRODUCT_ACTIONS_PENDING,
  },
  commercial_memory: {
    commercial_flags: Array.isArray(memory.commercial_flags) ? memory.commercial_flags : [],
    last_quote: memory.last_quote || null,
    last_appointment: memory.last_appointment || null,
  },
  allowed_actions: cleanArray(allowedActions),
};

return [{
  json: {
    context_packet: contextPacket,
    meta: {
      ...meta,
      source: "context_builder",
      context_builder_version: "2.2.0",
      allowed_actions_strategy: "stage_machine_with_data_filters",
      business_config_source: business.config_source,
      agent_context_loaded: !!agent?.id,
      knowledge_chunks_count: knowledgeChunks.length,
      knowledge_retrieval_ok: knowledgeRetrievalOk,
    },
  },
}];
