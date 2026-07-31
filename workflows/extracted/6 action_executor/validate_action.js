// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        validate_action
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const globalAllowedActions = [
  // Flujo base
  "ask_missing_data",
  "send_quote",
  "answer_question",
  "answer_objection",
  "offer_booking",
  "offer_available_slots",
  "confirm_booking",
  "schedule_followup",
  "handoff_human",

  // Prioridad 2 - flujo comercial completo
  "cancel_booking",
  "reschedule_booking",
  "collect_address",
  "confirm_address",
  "send_pre_service_instructions",
  "notify_on_the_way",
  "request_review",
  "request_referral",
  "send_service_menu",
  "recommend_service",
  "ask_payment_preference",
  "check_payment_status"
];

let action = $json.decision?.action;
let contextAllowedActions = $json.context_packet?.allowed_actions;
const errors = [];
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

function asksRecommendation(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("que me recomiendas") ||
    t.includes("que recomiendas") ||
    t.includes("cual me recomiendas") ||
    t.includes("cual me conviene") ||
    t.includes("no se cual elegir") ||
    t.includes("no se que servicio") ||
    t.includes("ayudame a elegir") ||
    t.includes("recomiendame")
  );
}

const state = $json.context_packet?.state || {};

const quoteFailureLock =
  state.last_bot_action === "pricing_rule_not_found" ||
  state.next_goal === "manual_pricing_review";

if (quoteFailureLock && action !== "handoff_human") {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("handoff_human")) {
    contextAllowedActions = ["handoff_human", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  action = "handoff_human";

  $json.decision = {
    ...($json.decision || {}),
    action: "handoff_human",
    reason: "action_executor_guard_quote_failure_lock",
    message:
      "No pude calcular la cotización. Te voy a derivar con un asesor para confirmar precio antes de agendar.",
    handoff_reason: $json.decision?.handoff_reason || "quote_pricing_not_available",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "human_handoff",
      human_handoff: true,
      next_goal: "manual_pricing_review",
      last_bot_action: "pricing_rule_not_found",
      missing_fields: []
    }
  };
}

const hasCommercialContext =
  isFilled(state.service_interest) &&
  isFilled(state.vehicle_type) &&
  isFilled(state.district);

const latestUserMessage = $json.context_packet?.conversation?.latest_user_message || "";
function userComplaintIntent(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes("reclamo") ||
    t.includes("reclamar") ||
    t.includes("muy molesto") ||
    t.includes("muy molesta") ||
    t.includes("molesto") ||
    t.includes("molesta") ||
    t.includes("pesimo") ||
    t.includes("pesima") ||
    t.includes("mal servicio") ||
    t.includes("mala experiencia") ||
    t.includes("quiero quejarme") ||
    t.includes("quiero hacer un reclamo") ||
    t.includes("quiero poner un reclamo") ||
    t.includes("necesito soporte")
  );
}

function userReturningCustomerIntent(rawText) {
  const t = normalizeText(rawText);
  const returningSignals =
    t.includes("hace meses") ||
    t.includes("ya lave con ustedes") ||
    t.includes("lave con ustedes") ||
    t.includes("lavado con ustedes") ||
    t.includes("fui cliente") ||
    t.includes("ya fui cliente") ||
    t.includes("otra vez") ||
    t.includes("de nuevo") ||
    t.includes("volver a cotizar") ||
    t.includes("cotizar de nuevo") ||
    t.includes("quiero volver") ||
    t.includes("quiero retomar");

  const commercialIntent =
    t.includes("cotizar") ||
    t.includes("precio") ||
    t.includes("valor") ||
    t.includes("agendar") ||
    t.includes("reserva");

  return returningSignals && commercialIntent;
}

function userExplicitHumanRequest(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes("hablar con un humano") ||
    t.includes("hablar con una persona") ||
    t.includes("asesor humano") ||
    t.includes("agente humano") ||
    t.includes("derivame con un humano") ||
    t.includes("quiero un humano") ||
    t.includes("necesito un humano") ||
    t.includes("atencion humana")
  );
}

if (userComplaintIntent(latestUserMessage) && state.human_handoff !== true) {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("handoff_human")) {
    contextAllowedActions = ["handoff_human", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  action = "answer_question";

  $json.decision = {
    ...($json.decision || {}),
    action: "answer_question",
    reason: "action_executor_guard_customer_complaint_handoff",
    message:
      "Lamento lo ocurrido. Voy a derivarte con una persona del equipo para revisar tu reclamo y ayudarte ahora.",
    handoff_reason: $json.decision?.handoff_reason || "customer_complaint",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "human_handoff",
      human_handoff: true,
      intent_last: "customer_complaint",
      next_goal: "human_takeover",
      last_bot_action: "handoff_human",
      missing_fields: []
    }
  };
}

if (userExplicitHumanRequest(latestUserMessage)) {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("handoff_human")) {
    contextAllowedActions = ["handoff_human", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  action = "handoff_human";

  $json.decision = {
    ...($json.decision || {}),
    action: "handoff_human",
    reason: "action_executor_guard_explicit_human_request",
    message:
      $json.decision?.message ||
      "Te voy a derivar con una persona para ayudarte mejor.",
    handoff_reason: $json.decision?.handoff_reason || "user_requested_human",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "human_handoff",
      human_handoff: true,
      next_goal: "human_takeover",
      last_bot_action: "handoff_human",
      missing_fields: []
    }
  };
}


function userUrgent(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes("urgente") ||
    t.includes("urgencia") ||
    t.includes("emergencia")
  );
}

if (userUrgent(latestUserMessage) && state.human_handoff !== true) {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("handoff_human")) {
    contextAllowedActions = ["handoff_human", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  action = "handoff_human";

  $json.decision = {
    ...($json.decision || {}),
    action: "handoff_human",
    reason: "action_executor_guard_urgent_handoff",
    message:
      $json.decision?.message ||
      "Te voy a derivar con una persona para ayudarte mejor.",
    handoff_reason: $json.decision?.handoff_reason || "urgent_handoff",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "human_handoff",
      human_handoff: true,
      next_goal: "human_takeover",
      last_bot_action: "handoff_human",
      missing_fields: []
    }
  };
}
// Handoff lock guard: si ya hay handoff activo, mantener el lock
if (state.human_handoff === true && action && action !== "handoff_human") {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("handoff_human")) {
    contextAllowedActions = ["handoff_human", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  action = "handoff_human";

  $json.decision = {
    ...($json.decision || {}),
    action: "handoff_human",
    reason: "action_executor_guard_handoff_lock",
    message:
      $json.decision?.message ||
      "Ya estas siendo atendido por una persona. En breve te responderan.",
    handoff_reason: $json.decision?.handoff_reason || "handoff_lock",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "human_handoff",
      human_handoff: true,
      next_goal: "wait_human_response",
      last_bot_action: "human_handoff_already_active",
      missing_fields: []
    }
  };
}

function userPostpones(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes("despues te aviso") ||
    t.includes("te aviso despues") ||
    t.includes("luego te aviso") ||
    t.includes("mas adelante") ||
    t.includes("otro dia") ||
    t.includes("en otro momento") ||
    t.includes("lo veo y te aviso")
  );
}


if (
  action === "offer_booking" &&
  hasCommercialContext &&
  state.stage === "quoted" &&
  userPostpones(latestUserMessage)
) {
  const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("schedule_followup")) {
  contextAllowedActions = ["schedule_followup", ...contextAllowedActions];
  $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
}
  action = "schedule_followup";

  $json.decision = {
    ...($json.decision || {}),
    action: "schedule_followup",
    reason: "action_executor_guard_postponed_followup_scheduled",
    followup_type: $json.decision?.followup_type || "post_quote_postponed_24h",
    scheduled_for: $json.decision?.scheduled_for || scheduledFor,
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "closing",
      intent_last: "followup_scheduled",
      next_goal: "wait_followup",
      last_bot_action: "schedule_followup",
    },
  };
}


if (
  userReturningCustomerIntent(latestUserMessage) &&
  action === "ask_missing_data" &&
  !isFilled(state.service_interest) &&
  (isFilled(state.vehicle_type) || isFilled(state.district))
) {
  if (Array.isArray(contextAllowedActions) && !contextAllowedActions.includes("answer_question")) {
    contextAllowedActions = ["answer_question", ...contextAllowedActions];
    $json.context_packet = { ...($json.context_packet || {}), allowed_actions: contextAllowedActions };
  }

  const vehicleText = isFilled(state.vehicle_type) ? " para tu " + String(state.vehicle_type).toLowerCase() : "";
  const districtText = isFilled(state.district) ? " en " + state.district : "";

  action = "answer_question";

  $json.decision = {
    ...($json.decision || {}),
    action: "answer_question",
    reason: "action_executor_guard_returning_customer_collect_service",
    message:
      "Perfecto, retomemos" + vehicleText + districtText + ". Para cotizar, quieres lavado basico, lavado premium o encerado full?",
    state_update: {
      ...($json.decision?.state_update || {}),
      stage: "service_discovery",
      intent_last: "returning_customer_reactivated",
      next_goal: "collect_service_interest",
      last_bot_action: "answer_question",
      missing_fields: ["service_interest"]
    }
  };
}

if (
  action === "recommend_service" &&
  hasCommercialContext &&
  !asksRecommendation(latestUserMessage) &&
  Array.isArray(contextAllowedActions) &&
  contextAllowedActions.includes("send_quote")
) {
  action = "send_quote";

  $json.decision = {
    ...($json.decision || {}),
    action: "send_quote",
    reason: "action_executor_guard_forced_send_quote_because_service_vehicle_district_are_complete",
    state_update: {
      ...($json.decision?.state_update || {}),
      service_interest: state.service_interest,
      vehicle_type: state.vehicle_type,
      district: state.district,
      stage: "qualified",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",
      missing_fields: []
    }
  };
}

if (!action) {
  errors.push("Missing action");
}

if (action && !globalAllowedActions.includes(action)) {
  errors.push(`Unsupported action: ${action}`);
}

if (!Array.isArray(contextAllowedActions) || contextAllowedActions.length === 0) {
  errors.push("Missing or empty context_packet.allowed_actions");
}

if (
  action &&
  Array.isArray(contextAllowedActions) &&
  contextAllowedActions.length > 0 &&
  !contextAllowedActions.includes(action)
) {
  errors.push(
    `Action not allowed in current state: ${action}. Allowed: ${contextAllowedActions.join(", ")}`
  );
}

if (errors.length > 0) {
  return [{
    error: true,
    errors,
    original: $json
  }];
}

return [{
  ...$json,
  validation: {
    global_action_valid: true,
    context_action_valid: true,
    allowed_actions_checked: contextAllowedActions
  }
}];
