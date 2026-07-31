// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 3 rules_engine  (workflow id e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5)
// Nodo:        rules_evaluation
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const event = $json.event ?? {};
const lead = $json.lead ?? {};
const leadState = $json.lead_state ?? {};
const memory = $json.memory ?? {};
const businessRules = $json.business_rules ?? {};
const LEGACY_FALLBACK_BUSINESS_NAME =
  ($json.agent_business_config?.config?.business_name) ||
  ($json.agent?.name) ||
  ($json.organization?.name) ||
  'nuestro negocio';
const organization = $json.organization ?? {};
const agentBusinessConfig = $json.agent_business_config ?? {};
if (agentBusinessConfig?.config?.pricing_policy?.requires_service_vehicle_district === false) {
  if (!leadState.district || String(leadState.district).trim() === '') {
    leadState.district = (agentBusinessConfig?.config?.coverage?.districts || [])[0] || 'Local';
  }
  if (!leadState.service_address && !leadState.address && !leadState.address_reference) {
    leadState.service_address = 'Atencion en nuestro local';
  }
  leadState.address_confirmed = true;
}
const agent = $json.agent ?? {};
const agentRules = Array.isArray($json.agent_rules) ? $json.agent_rules : [];
const agentTools = Array.isArray($json.agent_tools) ? $json.agent_tools : [];
const agentStaff = Array.isArray($json.agent_staff) ? $json.agent_staff : [];
const routing = $json.routing ?? {};

const text = String(event.text ?? '').trim();
const textLower = text.toLowerCase();

const LEGACY_REQUIRED_FIELDS_BY_STAGE = {
  default: ['service_interest', 'district', 'vehicle_type'],
  new_lead: ['service_interest', 'district', 'vehicle_type'],
  qualified: ['service_interest', 'district', 'vehicle_type'],
  quoted: ['service_interest', 'district', 'vehicle_type'],
  closing: ['service_interest', 'district', 'vehicle_type'],
  booking_selection: ['service_interest', 'district', 'vehicle_type'],
  booking_confirmation: ['service_interest', 'district', 'vehicle_type', 'booking_date', 'booking_time'],
  collecting_address: ['address'],
  address_confirmation: [],
  booked: [],
  cancelling: [],
  reschedule: [],
  post_service: [],
  human_handoff: [],
};

function buildLegacyServiceInterestMessage() {
  const legacyText = "Gracias por escribir a " + LEGACY_FALLBACK_BUSINESS_NAME + ". Te ayudo a elegir el servicio ideal para tu auto.\n\nTenemos 3 opciones:\n1. Lavado basico: mantencion rapida para dejarlo limpio por dentro y fuera.\n2. Lavado premium: limpieza mas completa y detallada, ideal si viene bien sucio o quieres un resultado mas pro.\n3. Encerado full: proteccion y brillo para la pintura.\n\nCual te interesa? Si no estas seguro, cuentame como esta tu auto y te recomiendo uno.";
  const configuredServices = Array.isArray(agentBusinessConfig?.config?.services) ? agentBusinessConfig.config.services : [];
  if (configuredServices.length === 0) return legacyText;

  const lines = configuredServices.map((s, i) => {
    const name = s.name || s.key || ("Opcion " + (i + 1));
    const desc = s.description ? (": " + s.description) : "";
    return (i + 1) + ". " + name + desc;
  });

  return "Gracias por escribir a " + LEGACY_FALLBACK_BUSINESS_NAME + ". Te ayudo a elegir el servicio ideal.\n\nTenemos " + configuredServices.length + " " + (configuredServices.length === 1 ? "opcion" : "opciones") + ":\n" + lines.join("\n") + "\n\nCual te interesa?";
}

function buildLegacyVehicleTypeMessage() {
  const legacyText = "Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon.";
  const cd = getClassificationDimensionConfig();
  if (!cd) return legacyText;

  const label = cd.label || "tipo de vehiculo";
  const options = buildVehicleCategoriesPrompt(null);
  if (!options) return legacyText;

  return "Perfecto. Para cotizar bien, dime tu " + label + "? Puede ser " + options + ".";
}

const LEGACY_MISSING_FIELD_MESSAGES = {
  service_interest: buildLegacyServiceInterestMessage(),
  district: 'Perfecto. Para ayudarte bien, en que comuna estas?',
  vehicle_type: buildLegacyVehicleTypeMessage(),
  booking_date: 'Perfecto. Para que dia te gustaria agendar?',
  booking_time: 'Perfecto. Que horario te acomoda?',
  address: 'Perfecto. Para dejar la reserva bien registrada, me puedes enviar la direccion exacta donde seria el servicio?',
  default: 'Necesito un poco mas de informacion para continuar.',
};

const LEGACY_NEXT_GOAL_BY_FIELD = {
  service_interest: 'collect_service_interest',
  district: 'collect_district',
  vehicle_type: 'collect_vehicle_type',
  booking_date: 'collect_booking_date',
  booking_time: 'collect_booking_time',
  address: 'collect_address',
  default: 'collect_missing_data',
};

function asObject(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function findAgentRule(ruleKey) {
  return agentRules.find((rule) => {
    const key = rule?.rule_key || rule?.key || null;
    return key === ruleKey && rule?.is_active !== false;
  }) || null;
}

const leadRequiredFieldsRule = findAgentRule('lead_required_fields');
const leadRequiredFieldsConfig = asObject(leadRequiredFieldsRule?.config);
const REQUIRED_FIELDS_BY_STAGE = asObject(
  leadRequiredFieldsConfig.required_fields_by_stage,
  LEGACY_REQUIRED_FIELDS_BY_STAGE
);
const MISSING_FIELD_MESSAGES = asObject(
  leadRequiredFieldsConfig.missing_field_messages,
  LEGACY_MISSING_FIELD_MESSAGES
);
const NEXT_GOAL_BY_FIELD = asObject(
  leadRequiredFieldsConfig.next_goal_by_field,
  LEGACY_NEXT_GOAL_BY_FIELD
);

const configUsed = {
  agent_id: agent?.id || routing?.agent_id || null,
  organization_id: organization?.id || routing?.organization_id || null,
  rules_version: Number(leadRequiredFieldsConfig.version || 0) || 0,
  configurable_rules: leadRequiredFieldsRule ? ['lead_required_fields'] : [],
  fallback: leadRequiredFieldsRule ? false : true,
};

function isMissing(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function hasAttachments(evt) {
  return Array.isArray(evt.attachments) && evt.attachments.length > 0;
}

function isEffectivelyEmptyMessage(evt) {
  const textEmpty =
    evt?.text === null ||
    evt?.text === undefined ||
    String(evt.text).trim().length === 0;

  return textEmpty && !hasAttachments(evt);
}

function containsAny(textValue, keywords) {
  return keywords.some((k) => textValue.includes(k));
}

function getRequiredFields(stage) {
  return REQUIRED_FIELDS_BY_STAGE[stage] ?? REQUIRED_FIELDS_BY_STAGE.default ?? LEGACY_REQUIRED_FIELDS_BY_STAGE.default;
}


function buildMissingFieldMessage(field) {
  return MISSING_FIELD_MESSAGES[field] ?? MISSING_FIELD_MESSAGES.default ?? LEGACY_MISSING_FIELD_MESSAGES.default;
}

function buildNextGoal(field) {
  return NEXT_GOAL_BY_FIELD[field] ?? NEXT_GOAL_BY_FIELD.default ?? LEGACY_NEXT_GOAL_BY_FIELD.default;
}

function buildRuleResult({
  resolutionType,
  action = null,
  reason,
  message = null,
  missingFields = [],
  shouldCallLlm = false,
  stateUpdate = {},
  ruleName = null,
  priority = null,
}) {
  return {
    resolution_type: resolutionType,
    action,
    reason,
    message,
    missing_fields: missingFields,
    should_call_llm: shouldCallLlm,
    state_update: stateUpdate,
    rule_name: ruleName,
    priority,
  };
}

/**
 * Normaliza texto:
 * - minsculas
 * - sin tildes
 * - sin espacios dobles
 */
function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// ---- Fase A (consolidacion multi-vertical): "classification_dimension" ----
// Generaliza el eje secundario de clasificacion (tipo de vehiculo en detailing,
// categoria de estilista en salon) via agent_business_config.config, en vez de
// tablas hardcodeadas por archivo. Si el agente no tiene este campo configurado
// (caso de detailing hoy), cada helper cae a su tabla LEGACY_* exacta de antes
// -- cero cambio de comportamiento mientras no se cree la fila de config nueva.
const LEGACY_CLASSIFICATION_GENERIC_LABELS = ["auto", "vehiculo", "automovil"];

const LEGACY_VEHICLE_TYPES_NORMALIZE = [
  { key: "SUV", keywords: ["suv", "jeep", "4x4"] },
  { key: "Camioneta", keywords: ["camioneta", "pickup", "pick up"] },
  { key: "Sedan", keywords: ["sedan", "sedn"] },
  { key: "Hatchback", keywords: ["hatchback"] },
  { key: "City car", keywords: ["city car", "citycar"] },
  { key: "Moto", keywords: ["moto", "motocicleta"] },
  { key: "Furgon", keywords: ["furgon", "furgn", "furgones", "van"] },
  { key: "Auto", keywords: ["auto", "automovil", "automvil", "vehiculo"] },
];

const LEGACY_VEHICLE_TYPES_EXTRACT = [
  { key: "SUV", keywords: ["suv", "jeep", "4x4"] },
  { key: "Camioneta", keywords: ["camioneta", "pickup", "pick up"] },
  { key: "Sedan", keywords: ["sedan", "sedn"] },
  { key: "Hatchback", keywords: ["hatchback"] },
  { key: "City car", keywords: ["city car", "citycar"] },
  { key: "Rural", keywords: ["rural", "station wagon", "stationwagon"] },
  { key: "Moto", keywords: ["moto", "motocicleta"] },
  { key: "Furgon", keywords: ["furgon", "furgn", "van"] },
];

const LEGACY_VEHICLE_OWNERSHIP_SIGNALS = [
  "tengo ", "mi auto es", "mi vehiculo es", "es un ", "es una ", "seria un ", "sera un ",
  "para mi ", "para una ", "para un ", "para camioneta", "para una camioneta",
  "para pickup", "para pick up", "para suv", "para auto",
];

const LEGACY_MENTIONS_ANOTHER_VEHICLE_SIGNALS = [
  "otro auto", "otro carro", "otro vehiculo", "otro coche",
  "segundo auto", "segundo carro", "segundo vehiculo",
  "2 autos", "2 carros", "2 vehiculos", "2 coches",
  "dos autos", "dos carros", "dos vehiculos", "dos coches",
];

function getClassificationDimensionConfig() {
  return agentBusinessConfig?.config?.classification_dimension || null;
}

function getClassificationValues(legacyTable) {
  const cd = getClassificationDimensionConfig();
  if (cd && Array.isArray(cd.values) && cd.values.length > 0) {
    return cd.values.map((v) => ({ key: v.key, keywords: Array.isArray(v.keywords) ? v.keywords : [] }));
  }
  return legacyTable;
}

function getClassificationGenericLabels() {
  const cd = getClassificationDimensionConfig();
  if (cd && Array.isArray(cd.generic_labels) && cd.generic_labels.length > 0) {
    return cd.generic_labels;
  }
  return LEGACY_CLASSIFICATION_GENERIC_LABELS;
}

function getClassificationOwnershipSignals() {
  const cd = getClassificationDimensionConfig();
  if (cd && Array.isArray(cd.ownership_signals) && cd.ownership_signals.length > 0) {
    return cd.ownership_signals;
  }
  return LEGACY_VEHICLE_OWNERSHIP_SIGNALS;
}

function getClassificationAnotherItemSignals() {
  const cd = getClassificationDimensionConfig();
  if (cd && Array.isArray(cd.another_item_signals) && cd.another_item_signals.length > 0) {
    return cd.another_item_signals;
  }
  return LEGACY_MENTIONS_ANOTHER_VEHICLE_SIGNALS;
}

function isGenericVehicleType(value) {
  const t = normalizeText(value);
  return getClassificationGenericLabels().map((label) => normalizeText(label)).includes(t);
}

function isMissingField(field, state) {
  if (field === "vehicle_type") {
    const vehicle = state?.vehicle_type || state?.confirmed_vehicle_type || "";
    if (isGenericVehicleType(vehicle)) return true;
  }

  return isMissing(state?.[field]);
}

function isQuestionLike(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("?") ||
    t.startsWith("lavan ") ||
    t.startsWith("hacen ") ||
    t.startsWith("atienden ") ||
    t.startsWith("trabajan ") ||
    t.startsWith("tienen ") ||
    t.includes("lavan motos") ||
    t.includes("lavan moto") ||
    t.includes("hacen motos") ||
    t.includes("hacen moto") ||
    t.includes("lavan furgon") ||
    t.includes("lavan furgones") ||
    t.includes("atienden furgon") ||
    t.includes("atienden furgones") ||
    t.includes("trabajan con motos") ||
    t.includes("trabajan con furgones")
  );
}
function userSaysWillReplyLater(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("despus te aviso") ||
    t.includes("despus le aviso") ||
    t.includes("despus te digo") ||
    t.includes("despus confirmo") ||
    t.includes("te aviso") ||
    t.includes("le aviso") ||
    t.includes("te confirmo") ||
    t.includes("luego te escribo") ||
    t.includes("luego te aviso") ||
    t.includes("ms adelante") ||
    t.includes("otro dia") ||
    t.includes("ms rato") ||
    t.includes("despus") ||
    t.includes("lo voy a pensar") ||
    t.includes("lo pensare") ||
    t.includes("lo pienso") ||
    t.includes("te escribo") ||
    t.includes("lo veo") ||
    t.includes("lo reviso")
  );
}

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
    t.includes("necesito soporte") ||
    t.includes("que asco") ||
    t.includes("asco de servicio") ||
    t.includes("porcaria") ||
    t.includes("porqueria") ||
    t.includes("una porqueria") ||
    t.includes("me estafaron") ||
    t.includes("me engaaron") ||
    t.includes("me enganaron") ||
    t.includes("me mintieron") ||
    t.includes("mentirosos") ||
    t.includes("estafadores") ||
    t.includes("no vuelvo") ||
    t.includes("nunca mas") ||
    t.includes("poner una denuncia") ||
    t.includes("poner denuncia") ||
    t.includes("voy a denunciar") ||
    t.includes("sernac") ||
    t.includes("exijo devolucion") ||
    t.includes("quiero mi plata") ||
    t.includes("quiero mi dinero") ||
    t.includes("poner mal en google") ||
    t.includes("decepcionado") ||
    t.includes("decepcionante") ||
    t.includes("peor lavado") ||
    t.includes("peor servicio") ||
    t.includes("me siento muy mal") ||
    t.includes("me siento pesimo") ||
    t.includes("muy insatisfecho") ||
    t.includes("insatisfecho con") ||
    t.includes("muy defraudado") ||
    t.includes("muy decepcionado") ||
    t.includes("llegaron tarde") ||
    t.includes("llegaron atrasados") ||
    t.includes("llegaron despues") ||
    t.includes("llegaste tarde") ||
    t.includes("llegaron mucho despues") ||
    t.includes("no llegaron a la hora") ||
    t.includes("tardaron mucho") ||
    t.includes("se demoraron mucho") ||
    t.includes("no quede conforme") ||
    t.includes("no quedo conforme") ||
    t.includes("llego tarde") ||
    t.includes("llego atrasado") ||
    t.includes("llego despues") ||
    t.includes("cobran demasiado") ||
    t.includes("decepciona") ||
    t.includes("quedo peor") ||
    t.includes("residuos de") ||
    t.includes("muy brusco") ||
    t.includes("tuve un problema con el servicio") ||
    t.includes("manchas de agua") ||
    t.includes("manchas en la carroceria") ||
    t.includes("interior mojado") ||
    t.includes("tapices mojados") ||
    t.includes("destiempo") ||
    t.includes("no duro nada") ||
    t.includes("no dura nada") ||
    t.includes("quedo opaco") ||
    t.includes("se veia opaco") ||
    t.includes("no me aviso") ||
    t.includes("me hicieron perder") ||
    t.includes("no cumplieron el horario") ||
    t.includes("no respetaron el horario") ||
    t.includes("mala puntualidad") ||
    t.includes("que falta de respeto") ||
    t.includes("incumplieron") ||
    t.includes("incumplimiento") ||
    t.includes("intente agendar") ||
    t.includes("intento agendar") ||
    t.includes("no pude agendar") ||
    t.includes("no pude reservar") ||
    t.includes("problema para agendar") ||
    t.includes("problemas para agendar") ||
    t.includes("problemas con el agendamiento") ||
    t.includes("error al agendar") ||
    t.includes("falla el sistema") ||
    t.includes("el sistema falla") ||
    t.includes("hay algun problema") ||
    t.includes("siempre hay") ||
    t.includes("tuve un problema") ||
    t.includes("muy mala") ||
    t.includes("fue mala") ||
    t.includes("salio mal") ||
    t.includes("salio muy mal") ||
    t.includes("fue horrible") ||
    t.includes("horrible el servicio") ||
    t.includes("fue terrible") ||
    t.includes("terrible el servicio") ||
    t.includes("tengo un problema con")
  );
}


function isAskingIfBot(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes('eres un bot') || t.includes('eres bot') ||
    t.includes('eres humano') || t.includes('eres persona') ||
    t.includes('eres real') || t.includes('eres ia') ||
    t.includes('hablo con una persona') || t.includes('hablo con un humano') ||
    t.includes('quien me atiende') || t.includes('es un bot') ||
    t.includes('chat automatico') || t.includes('hablas con alguien') ||
    t.includes('me contestas tu') || t.includes('hablo con un robot')
  );
}

// ---- Fase B (consolidacion multi-vertical): helpers de texto compartidos ----
// Arman listas legibles ("A, B o C") a partir de la config real del agente en vez
// de un string fijo por rubro. Si no hay config (caso de detailing hoy, o un
// agente que todavia no cargo el campo), devuelven el texto LEGACY exacto que
// tenia cada mensaje antes -- cero cambio de comportamiento por default.
function buildServiceEnumerationText(legacyText) {
  const configuredServices = Array.isArray(agentBusinessConfig?.config?.services)
    ? agentBusinessConfig.config.services
    : [];

  const names = configuredServices
    .map((s) => (s.name || s.key || ''))
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + " o " + names[1];
  if (names.length > 2) return names.slice(0, -1).join(", ") + " o " + names[names.length - 1];

  return legacyText;
}

function buildVehicleCategoriesPrompt(legacyText) {
  const cd = getClassificationDimensionConfig();
  const labels = (cd && Array.isArray(cd.values) ? cd.values : [])
    .map((v) => v.key)
    .filter(Boolean);

  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels[0] + " o " + labels[1];
  if (labels.length > 2) return labels.slice(0, -1).join(", ") + " o " + labels[labels.length - 1];

  return legacyText;
}

function ruleIsBot(ctx) {
  if (!isAskingIfBot(ctx.text)) return null;
  const _botBusinessName =
    ctx.agentBusinessConfig?.config?.business_name ||
    ctx.organization?.name ||
    ctx.agent?.name ||
    "nuestro negocio";
  return buildRuleResult({
    resolutionType: 'rule_based',
    action: 'ask_missing_data',
    reason: 'user_asking_if_bot',
    message: 'Soy un asistente virtual de ' + _botBusinessName + '. Estoy aqui para ayudarte a cotizar y reservar tu servicio. Si necesitas hablar con una persona del equipo, con gusto te conecto.',
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: { last_bot_action: 'ask_missing_data' },
    ruleName: 'rule_is_bot_disclosure',
    priority: 95
  });
}

function ruleComplaintHandoff(ctx) {
  if (!userComplaintIntent(ctx.text)) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "customer_complaint_requires_human_handoff",
    message: "Lamento lo ocurrido. Voy a derivarte con una persona del equipo para revisar tu reclamo y ayudarte ahora.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "human_handoff",
      intent_last: "customer_complaint",
      next_goal: "human_takeover",
      last_bot_action: "handoff_human",
      human_handoff: true,
      missing_fields: []
    },
    ruleName: "rule_customer_complaint_handoff",
    priority: 99
  });
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

function ruleReturningCustomerReactivation(ctx) {
  if (!userReturningCustomerIntent(ctx.text)) return null;
  if (ctx.leadState.human_handoff === true) return null;

  const hasService = !isMissing(ctx.leadState.service_interest);
  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  if (hasService && hasVehicle && hasDistrict) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "send_quote",
      reason: "returning_customer_ready_to_quote",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "qualified",
        intent_last: "returning_customer_reactivated",
        next_goal: "send_quote",
        last_bot_action: "send_quote_in_progress",
        missing_fields: []
      },
      ruleName: "rule_returning_customer_send_quote",
      priority: 89
    });
  }

  if (!hasService && (hasVehicle || hasDistrict)) {
    const vehicleText = hasVehicle ? " para tu " + String(ctx.leadState.vehicle_type).toLowerCase() : "";
    const districtText = hasDistrict ? " en " + ctx.leadState.district : "";

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "returning_customer_needs_service_selection",
      message: "Perfecto, retomemos" + vehicleText + districtText + ". Para cotizar, quieres " + buildServiceEnumerationText("lavado basico, lavado premium o encerado full") + "?",
      missingFields: ["service_interest"],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "service_discovery",
        intent_last: "returning_customer_reactivated",
        next_goal: "collect_service_interest",
        last_bot_action: "answer_question",
        missing_fields: ["service_interest"]
      },
      ruleName: "rule_returning_customer_collect_service",
      priority: 89
    });
  }

  return null;
}

function buildScheduledForIso(hoursAhead) {
  const ms = Math.max(1, Number(hoursAhead || 24)) * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}function normalizeDistrictValue(value) {
  const t = normalizeText(String(value || "").replace(/_/g, " "));

  const map = {
    "huechuraba": "Huechuraba",
    "vitacura": "Vitacura",
    "las condes": "Las Condes",
    "providencia": "Providencia",
    "provicencia": "Providencia",
    "lo barnechea": "Lo Barnechea",
    "santiago centro": "Santiago Centro",
    "santiago": "Santiago",
    "nunoa": "Nunoa",
    "unoa": "Nunoa",
    "independencia": "Independencia",
    "recoleta": "Recoleta",
    "quilicura": "Quilicura",
    "conchali": "Conchali",
    "conchal": "Conchali",
    "colina": "Colina",
    "la reina": "La Reina",
    "penalolen": "Penalolen",
    "pealolen": "Penalolen",
    "macul": "Macul",
    "la florida": "La Florida",
    "maipu": "Maipu",
    "maip": "Maipu",
    "san miguel": "San Miguel",
    "la cisterna": "La Cisterna",
    "puente alto": "Puente Alto",
    "pudahuel": "Pudahuel",
    "renca": "Renca",
  };

  return map[t] || null;
}
function isVehicleCollectionContext(leadState) {
  return (
    leadState.next_goal === "collect_vehicle_type" ||
    leadState.next_goal === "collect_vehicle_and_district" ||
    leadState.last_bot_action === "ask_missing_data" ||
    leadState.missing_fields?.includes?.("vehicle_type")
  );
}

function hasExplicitVehicleOwnership(rawText) {
  const t = normalizeText(rawText);
  return getClassificationOwnershipSignals().some((signal) => t.includes(signal));
}

function hasBookingIntent(rawText) {
  const t = normalizeText(rawText);
  return (
    t.includes("agendar") ||
    t.includes("agenda") ||
    t.includes("reservar") ||
    t.includes("reserva") ||
    t.includes("hora disponible") ||
    t.includes("horarios disponibles")
  );
}

function normalizeVehicleType(value) {
  const t = normalizeText(value);
  const table = getClassificationValues(LEGACY_VEHICLE_TYPES_NORMALIZE);

  for (const entry of table) {
    if (entry.keywords.some((k) => t.includes(normalizeText(k)))) return entry.key;
  }

  return null;
}

function classifyVehicleFromText(rawText, leadState) {
  const mentioned = extractVehicleTypeFromText(rawText);

  if (!mentioned) {
    return {
      mentioned_vehicle_type: null,
      confirmed_vehicle_type: null,
      should_confirm_vehicle: false,
    };
  }

  const normalizedVehicle = normalizeVehicleType(mentioned);
  const isGenericVehicle = isGenericVehicleType(normalizedVehicle);

  function isQuoteRequestText(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("precio") ||
    t.includes("valor") ||
    t.includes("cotizacion") ||
    t.includes("cotizacion") ||
    t.includes("cuanto sale") ||
    t.includes("cuanto sale") ||
    t.includes("cuanto cuesta") ||
    t.includes("cuanto cuesta") ||
    t.includes("cuanto vale") ||
    t.includes("cuanto vale") ||
    t.includes("quiero cotizar") ||
    t.includes("me puedes cotizar") ||
    t.includes("cuanto basico") ||
    t.includes("cuanto premium") ||
    t.includes("cuanto encerado") ||
    t.includes("cuanto lavado") ||
    t.includes("cuanto cobran") ||
    t.includes("cuanto es el") ||
    t.includes("cuanto seria") ||
    (t.startsWith("cuanto ") && !t.includes("cuanto tiempo") && !t.includes("cuanto demora") && !t.includes("cuanto tarda"))
  );
}
  const shouldConfirm =
  !isGenericVehicle &&
  (
    isVehicleCollectionContext(leadState) ||
    hasExplicitVehicleOwnership(rawText) ||
    isQuoteRequestText(rawText) ||
    hasBookingIntent(rawText)
  );

  return {
    mentioned_vehicle_type: normalizedVehicle,
    confirmed_vehicle_type: shouldConfirm ? normalizedVehicle : null,
    should_confirm_vehicle: shouldConfirm,
  };
}
function isPositivePostServiceMessage(rawText) {
  const normalized = normalizeText(rawText);

  const positiveSignals = [
    "quedo muy bueno",
    "quedo bueno",
    "quedo buenisimo",
    "buenisimo",
    "quedo excelente",
    "quedo impecable",
    "muy buen servicio",
    "excelente servicio",
    "buen servicio",
    "me gusto",
    "me gust",
    "quede conforme",
    "qued conforme",
    "todo bien",
    "muchas gracias",
    "gracias quedo",
    "gracias qued",
    "impecable",
    "la raja",
    "bacan",
    "bacn",
    "recomendado",
    "muy conforme"
  ];

  const serviceDoneSignals = [
    "lavado",
    "servicio",
    "auto",
    "vehiculo",
    "vehiculo",
    "limpieza",
    "trabajo",
    "quedo",
    "qued"
  ];

  const hasPositiveSignal = positiveSignals.some((key) =>
    normalized.includes(normalizeText(key))
  );

  const hasServiceDoneSignal = serviceDoneSignals.some((key) =>
    normalized.includes(normalizeText(key))
  );

  return hasPositiveSignal && hasServiceDoneSignal;
}

function isReferralIntent(rawText) {
  const normalized = normalizeText(rawText);

  const referralSignals = [
    "te puedo recomendar",
    "puedo recomendarte",
    "te voy a recomendar",
    "te recomendare",
    "te recomendar",
    "recomendar con un amigo",
    "recomendar con una amiga",
    "recomendar con alguien",
    "le puedo dar tu numero",
    "le puedo dar tu nmero",
    "pasarle tu contacto",
    "pasar tu contacto",
    "compartir tu whatsapp",
    "compartir el whatsapp",
    "tengo un amigo",
    "tengo una amiga",
    "referido",
    "referir",
    "referirte",
    "te paso un cliente",
    "te puedo pasar un cliente"
  ];

  const serviceRecommendationQuestions = [
    "que me recomiendas",
    "qu me recomiendas",
    "cual me recomiendas",
    "cul me recomiendas",
    "que servicio recomiendas",
    "qu servicio recomiendas"
  ];

  const isAskingForServiceRecommendation = serviceRecommendationQuestions.some((key) =>
    normalized.includes(normalizeText(key))
  );

  if (isAskingForServiceRecommendation) return false;

  return referralSignals.some((key) =>
    normalized.includes(normalizeText(key))
  );
}

/**
 * Detecta comuna desde el texto del usuario.
 * Puedes agregar ms comunas aqu.
 */
function extractDistrictFromText(rawText) {
  const normalized = normalizeText(rawText);

  const districts = [
    { key: 'huechuraba', value: 'Huechuraba' },
    { key: 'vitacura', value: 'Vitacura' },
    { key: 'las condes', value: 'Las Condes' },
    { key: 'providencia', value: 'Providencia' },
    { key: 'provicencia', value: 'Providencia' },
    { key: 'lo barnechea', value: 'Lo Barnechea' },
    { key: 'santiago centro', value: 'Santiago Centro' },
    { key: 'santiago', value: 'Santiago' },
    { key: 'nunoa', value: 'Nunoa' },
    { key: 'unoa', value: 'Nunoa' },
    { key: 'independencia', value: 'Independencia' },
    { key: 'recoleta', value: 'Recoleta' },
    { key: 'quilicura', value: 'Quilicura' },
    { key: 'conchali', value: 'Conchali' },
    { key: 'conchal', value: 'Conchali' },
    { key: 'colina', value: 'Colina' },
    { key: 'la reina', value: 'La Reina' },
    { key: 'penalolen', value: 'Penalolen' },
    { key: 'pealolen', value: 'Penalolen' },
    { key: 'macul', value: 'Macul' },
    { key: 'la florida', value: 'La Florida' },
    { key: 'maipu', value: 'Maipu' },
    { key: 'maip', value: 'Maipu' },
    { key: 'san miguel', value: 'San Miguel' },
    { key: 'la cisterna', value: 'La Cisterna' },
    { key: 'puente alto', value: 'Puente Alto' },
    { key: 'pudahuel', value: 'Pudahuel' },
    { key: 'renca', value: 'Renca' },
  ];

  const found = districts.find((district) =>
    normalized.includes(normalizeText(district.key))
  );

  return found ? found.value : null;
}

/**
 * Detecta tipo de vehiculo desde el texto del usuario.
 */
function extractVehicleTypeFromText(rawText) {
  const normalized = normalizeText(rawText);
  const table = getClassificationValues(LEGACY_VEHICLE_TYPES_EXTRACT);

  for (const entry of table) {
    if (entry.keywords.some((key) => normalized.includes(normalizeText(key)))) {
      return entry.key;
    }
  }

  return null;
}

/**
 * Detecta servicio desde el texto del usuario.
 * Esto ayuda cuando el usuario dice: "quiero lavado premium".
 */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prevRow = Array.from({ length: bl + 1 }, (_, j) => j);

  for (let i = 1; i <= al; i++) {
    const currRow = [i];

    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,
        currRow[j - 1] + 1,
        prevRow[j - 1] + cost
      );
    }

    prevRow = currRow;
  }

  return prevRow[bl];
}

function serviceKeyMatches(normalizedText, rawKey) {
  const key = normalizeText(rawKey);
  if (!key) return false;

  // Avoid false positives like "ceramico" matching the short key "cera".
  if (key === "cera") {
    return new RegExp("(^|\\s)cera($|\\s)").test(normalizedText);
  }

  if (normalizedText.includes(key)) return true;

  // Tolerar typos de 1 letra en palabras clave de una sola palabra
  // (ej.: "premiu" -> "premium"), sin afectar frases compuestas.
  if (!key.includes(" ") && key.length >= 6) {
    return normalizedText
      .split(/\s+/)
      .some(
        (word) =>
          word.length >= key.length - 2 &&
          word.length <= key.length + 2 &&
          levenshteinDistance(word, key) <= 1
      );
  }

  return false;
}

// Fase A (consolidacion multi-vertical): catalogo de servicios generico.
// Si el agente tiene agent_business_config.config.services[] (ya existe hoy para
// detailing y salon), se usa como fuente de keywords -- unido (no reemplazado) con
// LEGACY_SERVICE_CATALOG para el mismo "key" cuando coincide, porque el config real
// de detailing hoy trae MENOS alias por servicio que la tabla hardcodeada de antes
// (ej. "brillo"/"cera"/"esencial" no estan en sus aliases[] todavia) -- la union
// garantiza cero regresion sin depender de que alguien actualice esa fila primero.
const LEGACY_SERVICE_CATALOG = [
  {
    value: 'lavado_basico',
    keys: [
      'lavado basico', 'basico', 'esencial', 'lavado esencial', 'mantencion',
      'lavado de mantencion', 'lavado mantencion',
    ],
  },
  {
    value: 'lavado_premium',
    keys: [
      'lavado premium', 'premium', 'lavado profundo', 'profundo', 'interior full',
      'limpieza completa', 'lavado completo', 'completo', 'nivel 2', 'nivel 3',
    ],
  },
  {
    value: 'encerado_full',
    keys: ['encerado full', 'encerado', 'cera', 'proteccion pintura', 'sellado', 'brillo'],
  },
];

function extractServiceInterestFromText(rawText) {
  const normalized = normalizeText(rawText);
  const configuredServices = Array.isArray(agentBusinessConfig?.config?.services)
    ? agentBusinessConfig.config.services
    : [];

  if (configuredServices.length > 0) {
    for (const service of configuredServices) {
      const legacyMatch = LEGACY_SERVICE_CATALOG.find((s) => s.value === service.key);
      const keys = [
        service.key,
        service.name,
        ...(Array.isArray(service.aliases) ? service.aliases : []),
        ...(legacyMatch ? legacyMatch.keys : []),
      ].filter(Boolean);

      if (keys.some((key) => serviceKeyMatches(normalized, key))) {
        return service.key;
      }
    }

    return null;
  }

  for (const service of LEGACY_SERVICE_CATALOG) {
    if (service.keys.some((key) => serviceKeyMatches(normalized, key))) {
      return service.value;
    }
  }

  return null;
}

/**
 * Enriquece el lead_state usando el texto actual.
 * Esto evita loops como:
 * Bot: en qu comuna ests?
 * Usuario: Huechuraba
 * Bot: en qu comuna ests?
 */
const enrichedLeadState = {
  ...leadState,
};

const detectedStateUpdate = {};

if (isMissing(enrichedLeadState.service_interest)) {
  const detectedService = extractServiceInterestFromText(text);

  if (detectedService) {
    enrichedLeadState.service_interest = detectedService;
    detectedStateUpdate.service_interest = detectedService;
  }
}
// FIX D: override service when user explicitly asks for a different service
{
  const _svcT = normalizeText(text);
  const _isReQuote = !isMissing(enrichedLeadState.service_interest) && (
    userAsksPrice(text) ||
    _svcT.includes("prefiero el") || _svcT.includes("mejor el") ||
    _svcT.includes("en realidad") || _svcT.includes("cambia a") ||
    _svcT.includes("cambio a") || _svcT.includes("quiero el")
  );
  if (_isReQuote) {
    const _newSvc = extractServiceInterestFromText(text);
    if (_newSvc && _newSvc !== enrichedLeadState.service_interest) {
      enrichedLeadState.service_interest = _newSvc;
      detectedStateUpdate.service_interest = _newSvc;
    }
  }
}

if (isMissing(enrichedLeadState.district)) {
  const detectedDistrict = extractDistrictFromText(text);
  const normalizedDistrict = normalizeDistrictValue(detectedDistrict);

  if (normalizedDistrict) {
    enrichedLeadState.district = normalizedDistrict;

    detectedStateUpdate.district = normalizedDistrict;
    detectedStateUpdate.confirmed_district = normalizedDistrict;
  }
}

const vehicleDetection = classifyVehicleFromText(text, enrichedLeadState);

if (vehicleDetection.mentioned_vehicle_type) {
  detectedStateUpdate.mentioned_vehicle_type =
    vehicleDetection.mentioned_vehicle_type;
}

if (
  vehicleDetection.should_confirm_vehicle &&
  vehicleDetection.confirmed_vehicle_type
) {
  const _vehOverride =
    isMissing(enrichedLeadState.vehicle_type) ||
    (userAsksPrice(text) && vehicleDetection.confirmed_vehicle_type !== enrichedLeadState.vehicle_type);
  if (_vehOverride) {
    enrichedLeadState.vehicle_type = vehicleDetection.confirmed_vehicle_type;
    detectedStateUpdate.vehicle_type = vehicleDetection.confirmed_vehicle_type;
    detectedStateUpdate.confirmed_vehicle_type = vehicleDetection.confirmed_vehicle_type;
  }
}

// FIX E2: "no tengo [X] cuanto sale para [Y]" — user negates current vehicle and asks for a different one.
// extractVehicleTypeFromText picks X (first match), missing Y. Fix: extract vehicle after "para".
{
  const _e2t = normalizeText(text);
  const _curVeh = (enrichedLeadState.vehicle_type || "").toLowerCase();
  if (_curVeh && userAsksPrice(text)) {
    const _negated =
      _e2t.includes("no tengo " + _curVeh) ||
      _e2t.includes("no es un " + _curVeh) ||
      _e2t.includes("no es " + _curVeh) ||
      _e2t.includes("no tengo un " + _curVeh);
    if (_negated) {
      const _e2vehicles = [
        { keys: ['hatchback'], value: 'hatchback' },
        { keys: ['camioneta', 'pickup'], value: 'camioneta' },
        { keys: ['sedan'], value: 'sedan' },
        { keys: ['suv', 'jeep', '4x4'], value: 'suv' },
        { keys: ['furgon', 'van'], value: 'furgon' },
        { keys: ['moto'], value: 'moto' },
      ];
      const _afterPara = _e2t.includes(" para ") ? _e2t.split(" para ").slice(1).join(" para ") : "";
      const _newVeh = _e2vehicles.find(v => v.keys.some(k => (_afterPara || _e2t).includes(k) && k !== _curVeh));
      if (_newVeh && _newVeh.value !== _curVeh) {
        enrichedLeadState.vehicle_type = _newVeh.value;
        detectedStateUpdate.vehicle_type = _newVeh.value;
        detectedStateUpdate.confirmed_vehicle_type = _newVeh.value;
      }
    }
  }
}
function getNextDateForWeekdaySpanish(rawText) {
  const normalized = normalizeText(rawText);

  const weekdayMap = [
    { keys: ["lunes"], day: 1 },
    { keys: ["martes"], day: 2 },
    { keys: ["miercoles", "mircoles"], day: 3 },
    { keys: ["jueves"], day: 4 },
    { keys: ["viernes"], day: 5 },
    { keys: ["sabado", "sbado"], day: 6 },
    { keys: ["domingo"], day: 0 },
  ];

  const found = weekdayMap.find((item) =>
    item.keys.some((key) => normalized.includes(normalizeText(key)))
  );

  if (!found) return null;

  const now = new Date();

  // Chile: usamos fecha local aprximada desde el runtime.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDay = today.getDay();

  let diff = found.day - currentDay;

  // Si el da ya pas o es hoy, agenda para la prxima ocurrencia.
  if (diff <= 0) diff += 7;

  const target = new Date(today);
  target.setDate(today.getDate() + diff);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function extractBookingTimeFromText(rawText) {
  const normalized = normalizeText(rawText);

  // Casos: "a las 9", "9", "09:00", "9:30", "a las 14"
  const match =
    normalized.match(/\b(?:a las|alas|para las)?\s*(\d{1,2})(?::(\d{2}))?\b/);

  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;

  // Regla comercial simple: si dice 9, interpretamos 09:00.
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
const isSelectingOfferedSlotContext =
  (
    enrichedLeadState.stage === "booking_selection" ||
    enrichedLeadState.next_goal === "collect_selected_slot" ||
    enrichedLeadState.last_bot_action === "offer_available_slots"
  ) &&
  Array.isArray(enrichedLeadState.booking_options) &&
  enrichedLeadState.booking_options.length > 0;

const isBookingSelectionContext =
  enrichedLeadState.stage === "booking_selection" ||
  enrichedLeadState.next_goal === "collect_selected_slot" ||
  enrichedLeadState.last_bot_action === "offer_available_slots";

// Si el usuario esta eligiendo entre opciones 1, 2, 3,
// NO debemos interpretar "1" como hora 01:00 -- ver guard de tiempo mas abajo.
// El nombre de un dia (lunes/martes/... "el sabado") nunca puede confundirse
// con un digito de opcion, asi que esto se detecta SIEMPRE, incluso en medio
// de una seleccion de horarios -- permite que el cliente pida otro dia
// ("y el sabado?") sin que quede pegado en las opciones ya ofrecidas.
if (isMissing(enrichedLeadState.booking_date) || !isBookingSelectionContext) {
  const detectedBookingDate = getNextDateForWeekdaySpanish(text);

  if (detectedBookingDate && detectedBookingDate !== enrichedLeadState.booking_date) {
    enrichedLeadState.booking_date = detectedBookingDate;
    detectedStateUpdate.booking_date = detectedBookingDate;
    // Si el cliente pide explicitamente otro dia, las opciones offered
    // anteriores (de otro dia) ya no aplican -- se limpian para forzar una
    // busqueda nueva en vez de reofrecer las mismas.
    if (isBookingSelectionContext) {
      enrichedLeadState.booking_options = [];
      detectedStateUpdate.booking_options = [];
      enrichedLeadState.slot_id = null;
      detectedStateUpdate.slot_id = null;
    }
  }
}

if (!isBookingSelectionContext && isMissing(enrichedLeadState.booking_time)) {
  const detectedBookingTime = extractBookingTimeFromText(text);

  if (detectedBookingTime) {
    enrichedLeadState.booking_time = detectedBookingTime;
    detectedStateUpdate.booking_time = detectedBookingTime;
  }
}

if (
  enrichedLeadState.booking_date &&
  enrichedLeadState.booking_time &&
  isMissing(enrichedLeadState.slot_id)
) {
  enrichedLeadState.slot_id = `${enrichedLeadState.booking_date}_${enrichedLeadState.booking_time}`;
  detectedStateUpdate.slot_id = enrichedLeadState.slot_id;
}
function ruleManualSlotAvailabilityCheck(ctx) {
  const manualDateDetected = !!detectedStateUpdate.booking_date;
  const manualTimeDetected = !!detectedStateUpdate.booking_time;

  // Solo aplica cuando el usuario propuso una fecha/hora en este mensaje.
  if (!manualDateDetected || !manualTimeDetected) return null;

  // Si est seleccionando opcin 1, 2 o 3, no tratamos eso como horario manual.
  if (isSelectingOfferedSlotContext || isBookingSelectionContext) return null;

  const missingFields = [];

  if (isMissing(ctx.leadState.service_interest)) {
    missingFields.push("service_interest");
  }

  if (isMissingField("vehicle_type", ctx.leadState)) {
    missingFields.push("vehicle_type");
  }

  if (isMissing(ctx.leadState.district)) {
    missingFields.push("district");
  }

  if (missingFields.length > 0) {
    const firstMissing = missingFields[0];

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "manual_slot_requested_but_commercial_context_missing",
      message: buildMissingFieldMessage(firstMissing),
      missingFields,
      shouldCallLlm: false,
      stateUpdate: {
        booking_date: ctx.leadState.booking_date,
        booking_time: ctx.leadState.booking_time,
        slot_id: ctx.leadState.slot_id,

        availability_confirmed: false,

        missing_fields: missingFields,
        next_goal: buildNextGoal(firstMissing),
        last_bot_action: "ask_missing_data",
        intent_last: "manual_slot_requested_context_missing"
      },
      ruleName: "rule_manual_slot_availability_check_missing_context",
      priority: 91
    });
  }

  const bookingDate = ctx.leadState.booking_date;
  const bookingTime = ctx.leadState.booking_time;
  const slotId = ctx.leadState.slot_id || `${bookingDate}_${bookingTime}`;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "manual_slot_requested_check_calendar_before_collecting_address",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "manual_slot_requested",
      next_goal: "check_specific_slot_availability",
      last_bot_action: "offer_available_slots_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,

      availability_confirmed: false,

      availability_window: "this_week",
      availability_label: "el horario solicitado",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,

      missing_fields: []
    },
    ruleName: "rule_manual_slot_availability_check",
    priority: 91
  });
}

function ruleHumanHandoffLocked(ctx) {
  if (ctx.leadState.human_handoff === true || ctx.leadState.stage === 'human_handoff') {
    return buildRuleResult({
      resolutionType: 'rule_based',
      action: 'answer_question',
      reason: 'lead_marked_for_human_handoff',
      message: 'Tu caso ya est derivado a una persona. Te respondern por este mismo chat apenas puedan revisarlo.',
      shouldCallLlm: false,
      stateUpdate: {
        stage: 'human_handoff',
        human_handoff: true,
        next_goal: 'wait_human_response',
        last_bot_action: 'human_handoff_already_active',
        missing_fields: [],
      },
      ruleName: 'rule_human_handoff_locked',
      priority: 100,
    });
  }

  return null;
}

function ruleExplicitHumanRequest(ctx) {
  if (isAskingIfBot(ctx.text)) return null;
  const asksHuman = containsAny(normalizeText(ctx.text), [
    'quiero hablar con una persona',
    'quiero hablar con alguien',
    'quiero que me atienda una persona',
    'que me atienda una persona',
    'atienda una persona',
    'atienda un humano',
    'necesito que me atienda alguien',
    'persona del equipo',
    'atencion humana',
    'hablar con una persona',
    'hablar con alguien',
    'hablar con tu jefe',
    'hablar con el jefe',
    'hablar con un humano',
    'hablar con el dueno',
    'hablar con el encargado',
    'hablar con el gerente',
    'hablar con el supervisor',
    'con tu jefe',
    'tu jefe',
    'el dueno',
    'el encargado',
    'asesor',
    'agente',
    'ejecutivo',
    'humano',
    'persona real',
    'supervisor',
    'gerente',
    'no eres humano',
    'no es humano',
    'administrador',
    'chatbots',
    'chatbot',
    'sistemas automaticos',
    'sistema automatico',
    'necesito hablar con',
    'que me llame',
    'que me contacte',
    'que alguien me contacte',
    'para que me contacten',
    'que me llamen',
    'por favor llamame',
    'quiero que me contacten',
    'quiero que me llamen',
    'me contacten',
    'llamenme',
    'llamame',
    'atiendan por telefono',
    'quiero atencion directa',
    'eres un bot',
    'es urgente',
    'lo necesito urgente',
    'muy urgente',
    'atencion urgente',
    'eres un robot',
  ]);

  if (asksHuman) {
    return buildRuleResult({
      resolutionType: 'rule_based',
      action: 'handoff_human',
      reason: 'user_requested_human',
      message: 'Te voy a derivar con una persona para ayudarte mejor.',
      shouldCallLlm: false,
      stateUpdate: {
        stage: 'human_handoff',
        human_handoff: true,
        next_goal: 'human_takeover',
        last_bot_action: 'handoff_human',
        missing_fields: [],
      },
      ruleName: 'rule_explicit_human_request',
      priority: 95,
    });
  }

  return null;
}

function ruleEmptyMessage(ctx) {
  if (isEffectivelyEmptyMessage(ctx.event)) {
    return buildRuleResult({
      resolutionType: 'rule_based',
      action: 'ignore',
      reason: 'empty_message',
      message: null,
      shouldCallLlm: false,
      stateUpdate: {},
      ruleName: 'rule_empty_message',
      priority: 90,
    });
  }

  return null;
}

function hasServiceAddress(leadState) {
  return !!(
    leadState.service_address ||
    leadState.address ||
    leadState.address_reference ||
    leadState.address_confirmed === true
  );
}

function looksLikeAddress(rawText) {
  const normalized = normalizeText(rawText);

  if (!normalized || normalized.length < 8) return false;

  const hasNumber = /\d{2,6}/.test(normalized);

  const addressWords = [
    'calle',
    'avenida',
    'av',
    'av.',
    'pasaje',
    'camino',
    'condominio',
    'depto',
    'departamento',
    'casa',
    'block',
    'torre',
    'villa',
    'pje',
    'sector',
    'edificio',
    'porton',
    'portn'
  ];

  const hasAddressWord = addressWords.some((word) =>
    normalized.includes(normalizeText(word))
  );

  return hasNumber;
}

function stripAddressPrefix(rawText) {
  const prefixPatterns = [
    /^\s*mi\s+direcci[oó]n\s+(es|seria|sería)\s*:?\s*/i,
    /^\s*la\s+direcci[oó]n\s+(es|seria|sería)\s*:?\s*/i,
    /^\s*direcci[oó]n\s*:\s*/i,
    /^\s*es\s+en\s*:?\s*/i,
    /^\s*queda\s+en\s*:?\s*/i,
    /^\s*te\s+paso\s+la\s+direcci[oó]n\s*:?\s*/i,
  ];
  let cleaned = String(rawText || "").trim();
  for (const pattern of prefixPatterns) {
    const stripped = cleaned.replace(pattern, "");
    if (stripped !== cleaned && stripped.trim().length > 0) {
      cleaned = stripped.trim();
      break;
    }
  }
  return cleaned || String(rawText || "").trim();
}

function extractOrdinalOrNumberSelection(rawText) {
  const t = normalizeText(rawText);
  const numMatch = t.match(/\b([1-9])\b/);
  if (numMatch) return Number(numMatch[1]);
  if (t.includes("primera") || t.includes("primero")) return 1;
  if (t.includes("segunda") || t.includes("segundo")) return 2;
  if (t.includes("tercera") || t.includes("tercero")) return 3;
  if (t.includes("cuarta") || t.includes("cuarto")) return 4;
  return null;
}

const CANCEL_CLEAR_FIELDS = ["booking_date", "booking_time", "slot_id", "booking_options", "availability_confirmed"];

function buildCancelTargetStateUpdate(targetAppointmentId) {
  return {
    stage: "cancelling",
    intent_last: "cancel_booking_requested",
    next_goal: "cancel_active_booking",
    last_bot_action: "cancel_booking_in_progress",
    target_appointment_id: targetAppointmentId || null,
    // Limpiar el horario cancelado: si no, un "ok"/"si" suelto despues
    // puede ser malinterpretado como confirmar esa misma reserva de nuevo,
    // o el LLM puede reusar booking_options viejas para seguir ofreciendo
    // horarios que ya no corresponden.
    booking_date: null,
    booking_time: null,
    slot_id: null,
    availability_confirmed: false,
    booking_options: [],
    fields_to_clear: CANCEL_CLEAR_FIELDS,
    missing_fields: [],
  };
}

// Si el cliente ya tenia 2+ reservas activas y se le pregunto cual queria
// cancelar (rule_cancel_booking_needs_target), esta regla atrapa la
// respuesta ("2", "la segunda", etc.) y dispara la cancelacion apuntando a
// la reserva correcta -- sin esto, un numero suelto no significaba nada.
function ruleCancelTargetSelected(ctx) {
  if (ctx.leadState.intent_last !== "cancel_target_selection_pending") return null;

  const activeOnes = Array.isArray(ctx.memory?.active_appointments) ? ctx.memory.active_appointments : [];
  const selection = extractOrdinalOrNumberSelection(ctx.text);

  if (!selection || selection < 1 || selection > activeOnes.length) return null;

  const target = activeOnes[selection - 1];

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "cancel_booking",
    reason: "user_selected_cancel_target",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: buildCancelTargetStateUpdate(target.id),
    ruleName: "rule_cancel_target_selected",
    priority: 95,
  });
}

function ruleCancelBooking(ctx) {
  const normalized = normalizeText(ctx.text);

  const wantsCancel =
    normalized.includes("cancelar") ||
    normalized.includes("cancela") ||
    normalized.includes("cancelame") ||
    normalized.includes("anular") ||
    normalized.includes("anula") ||
    normalized.includes("anulame") ||
    normalized.includes("dar de baja") ||
    normalized.includes("dejar sin efecto") ||
    normalized.includes("no voy a poder") ||
    normalized.includes("no podre") ||
    normalized.includes("no podr") ||
    normalized.includes("no puedo asistir") ||
    normalized.includes("no podre asistir") ||
    normalized.includes("no podr asistir") ||
    normalized.includes("no puedo ir") ||
    normalized.includes("cancela la hora") ||
    normalized.includes("cancela mi hora") ||
    normalized.includes("cancela la reserva") ||
    normalized.includes("cancela mi reserva") ||
    normalized.includes("cancelar la hora") ||
    normalized.includes("cancelar mi hora") ||
    normalized.includes("cancelar la reserva") ||
    normalized.includes("cancelar mi reserva");
  if (!wantsCancel) return null;

  // Si hay 2+ reservas activas, no cancelar a ciegas la primera que aparezca
  // (bug real reportado por el usuario: pidio cancelar "la 2" y se cancelo
  // la 1 igual, porque no habia forma de apuntar a una reserva especifica).
  const activeOnes = Array.isArray(ctx.memory?.active_appointments) ? ctx.memory.active_appointments : (ctx.memory?.last_appointment ? [ctx.memory.last_appointment] : []);

  if (activeOnes.length > 1) {
    const selection = extractOrdinalOrNumberSelection(ctx.text);

    if (selection && selection >= 1 && selection <= activeOnes.length) {
      const target = activeOnes[selection - 1];
      return buildRuleResult({
        resolutionType: "rule_based",
        action: "cancel_booking",
        reason: "user_requested_cancellation_with_target",
        message: "",
        missingFields: [],
        shouldCallLlm: false,
        stateUpdate: buildCancelTargetStateUpdate(target.id),
        ruleName: "rule_cancel_booking_with_target",
        priority: 94,
      });
    }

    const lines = activeOnes.map((a, i) => `${i + 1}. ${formatAppointmentWhen(a.start_at)}`);
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "user_requested_cancellation_needs_target",
      message: `Tienes ${activeOnes.length} horas agendadas:\n\n${lines.join("\n")}\n\nCual quieres cancelar? Responde con el numero.`,
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        intent_last: "cancel_target_selection_pending",
        last_bot_action: "answer_question",
        missing_fields: [],
      },
      ruleName: "rule_cancel_booking_needs_target",
      priority: 94,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "cancel_booking",
    reason: "user_requested_cancellation",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: buildCancelTargetStateUpdate(activeOnes[0] ? activeOnes[0].id : null),
    ruleName: "rule_cancel_booking",
    priority: 94,
  });
}

function ruleRescheduleBooking(ctx) {
  const normalized = normalizeText(ctx.text);

  const clearRescheduleIntent =
    normalized.includes("reagendar") ||
    normalized.includes("reagenda") ||
    normalized.includes("reprogramar") ||
    normalized.includes("reprograma") ||
    normalized.includes("cambiar la hora") ||
    normalized.includes("cambiar hora") ||
    normalized.includes("cambiar mi hora") ||
    normalized.includes("cambiar mi horario") ||
    normalized.includes("cambiar mi cita") ||
    normalized.includes("cambiar el horario") ||
    normalized.includes("cambiar horario") ||
    normalized.includes("cambiar la reserva") ||
    normalized.includes("cambiar mi reserva") ||
    normalized.includes("cambiar fecha") ||
    normalized.includes("cambiar el dia") ||
    normalized.includes("cambiar el da") ||
    normalized.includes("mover la hora") ||
    normalized.includes("mover mi hora") ||
    normalized.includes("mover reserva") ||
    normalized.includes("mover la fecha") ||
    normalized.includes("mover mi cita") ||
    normalized.includes("mover la cita") ||
    normalized.includes("puedo mover") ||
    normalized.includes("puedo cambiar la fecha") ||
    normalized.includes("puedo cambiar mi cita") ||
    normalized.includes("es posible mover") ||
    normalized.includes("puedo reprogramar");

  const ambiguousScheduleChange =
    normalized.includes("otra hora") ||
    normalized.includes("otro horario") ||
    normalized.includes("otro dia") ||
    normalized.includes("otro da") ||
    normalized.includes("no puedo ese dia") ||
    normalized.includes("no puedo ese da") ||
    normalized.includes("no me sirve ese horario") ||
    normalized.includes("no me acomoda ese horario");

  const activeBookingContext =
    ctx.leadState.stage === "booked" ||
    ctx.leadState.stage === "reschedule" ||
    ctx.leadState.next_goal === "collect_new_slot" ||
    ctx.leadState.last_bot_action === "confirm_booking" ||
    ctx.leadState.last_bot_action === "reschedule_booking" ||
    ctx.leadState.last_bot_action === "reschedule_booking_in_progress" ||
    !!ctx.memory?.last_appointment;

  const wantsReschedule = clearRescheduleIntent || (ambiguousScheduleChange && activeBookingContext);

  if (!wantsReschedule) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "reschedule_booking",
    reason: "user_requested_reschedule",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "reschedule",
      intent_last: "reschedule_booking_requested",
      next_goal: "collect_new_slot",
      last_bot_action: "reschedule_booking_in_progress",
      booking_date: null,
      booking_time: null,
      slot_id: null,
      selected_slot: null,
      selected_booking_option: null,
      availability_confirmed: false,
      fields_to_clear: ["booking_date", "booking_time", "slot_id"],
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,
      booking_options: [],
      missing_fields: [],
    },
    ruleName: "rule_reschedule_booking",
    priority: 93,
  });
}

function isPureGreeting(rawText) {
  const t = normalizeText(rawText).replace(/[!.,?]/g, "").trim();
  if (!t) return false;

  return /^(hola|holi|hey|que tal|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hola buenas|hola buen dia|hola buenos dias|hola buenas tardes|hola buenas noches)$/.test(
    t
  );
}

function getActiveAppointment(ctx) {
  const appointment = ctx.memory?.last_appointment;

  const isActive =
    !!appointment &&
    ["confirmed", "pending", "booked"].includes(
      String(appointment.status || "").toLowerCase()
    );

  return isActive ? appointment : null;
}

function hasActiveAppointmentContext(ctx) {
  // No confiar en stage === "booked" solo: el stage nunca avanza automaticamente
  // despues de que pasa la fecha de la cita (no hay job de completado), por lo
  // que una reserva ya pasada quedaria "activa" para siempre. getActiveAppointment
  // ya filtra por start_at >= NOW() contra la tabla appointments, asi que es la
  // unica fuente confiable de verdad.
  return !!getActiveAppointment(ctx);
}

function ruleGreetingWithActiveBooking(ctx) {
  if (!isPureGreeting(ctx.text)) return null;
  if (ctx.leadState.human_handoff === true) return null;

  if (!hasActiveAppointmentContext(ctx)) return null;

  const service = ctx.leadState.service_interest
    ? String(ctx.leadState.service_interest).replace(/_/g, " ")
    : "tu servicio agendado";

  const date = ctx.leadState.booking_date || "";
  const time = ctx.leadState.booking_time || "";
  const when =
    date && time
      ? `${date} a las ${time}`
      : date || time || "la fecha coordinada";

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "greeting_with_active_booking_no_pre_service_spam",
    message: `Hola! Tienes agendado ${service} para ${when}. Te escribire con las indicaciones antes de la visita. Si necesitas cambiar algo o tienes alguna duda, dime.`,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_greeting_with_active_booking",
    priority: 88,
  });
}

function isPureAcknowledgment(rawText) {
  const t = normalizeText(rawText).replace(/[!.,?]/g, "").trim();
  if (!t) return false;

  return /^(ya|yaa|ok|okey|okay|vale|listo|dale|bueno|perfecto|de acuerdo|gracias|muchas gracias)$/.test(
    t
  );
}

function ruleAcknowledgeAfterPreServiceInstructions(ctx) {
  if (!isPureAcknowledgment(ctx.text)) return null;
  if (ctx.leadState.human_handoff === true) return null;
  if (!hasActiveAppointmentContext(ctx)) return null;

  const wasInstructionsAlreadySent =
    ctx.leadState.intent_last === "send_pre_service_instructions" ||
    ctx.leadState.last_bot_action === "send_pre_service_instructions" ||
    ctx.leadState.next_goal === "service_prepared" ||
    ctx.leadState.stage === "booked" ||
    ctx.leadState.last_bot_action === "confirm_booking";

  if (!wasInstructionsAlreadySent) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "acknowledgment_after_pre_service_instructions_no_repeat",
    message: "Perfecto, nos vemos en la fecha agendada. Si necesitas algo mas antes, escribeme.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_acknowledge_after_pre_service_instructions",
    priority: 88,
  });
}

// Distingue una nota/informacion adicional real (ej. "el conserje se llama Daniel,
// avisale que ya llego") de una pregunta genuina -- si parece pregunta, la dejamos
// pasar sin resolver aca (que la maneje otra regla o el LLM con contexto completo).
function looksLikeGenuineQuestionAboutAppointment(rawText) {
  const t = normalizeText(rawText);
  if (t.includes("?")) return true;

  const questionSignals = [
    "que hora", "a que hora", "cuando llegan", "cuando vienen", "cuanto tiempo",
    "cuanto demoran", "cual es", "donde", "como hago", "puedo cambiar",
    "necesito saber", "me confirman", "quisiera saber", "me pueden decir",
  ];

  return questionSignals.some((q) => t.includes(q));
}

function ruleAcknowledgeAdditionalNoteAfterPreServiceInstructions(ctx) {
  if (isEffectivelyEmptyMessage(ctx.event)) return null;
  if (isPureAcknowledgment(ctx.text)) return null;
  if (ctx.leadState.human_handoff === true) return null;
  if (!hasActiveAppointmentContext(ctx)) return null;
  if (looksLikeGenuineQuestionAboutAppointment(ctx.text)) return null;

  const wasInstructionsAlreadySent =
    ctx.leadState.intent_last === "send_pre_service_instructions" ||
    ctx.leadState.last_bot_action === "send_pre_service_instructions" ||
    ctx.leadState.next_goal === "service_prepared" ||
    ctx.leadState.stage === "booked" ||
    ctx.leadState.last_bot_action === "confirm_booking";

  if (!wasInstructionsAlreadySent) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "acknowledgment_additional_note_after_pre_service_instructions",
    message: "Perfecto, gracias por la informacion, lo dejo anotado para el dia del servicio.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_acknowledge_additional_note_after_pre_service_instructions",
    priority: 88,
  });
}

function userAsksAboutExistingAppointment(rawText) {
  const t = normalizeText(rawText);

  const exactPhrase =
    t.includes("tengo hora") ||
    t.includes("tengo una hora") ||
    t.includes("tengo cita") ||
    t.includes("tengo reserva") ||
    t.includes("tengo una reserva") ||
    t.includes("tengo algo agendado") ||
    t.includes("tengo algo reservado") ||
    t.includes("tengo una hora agendada") ||
    t.includes("tengo hora agendada") ||
    t.includes("esta agendada mi hora") ||
    t.includes("tengo mi hora") ||
    t.includes("cual es mi hora") ||
    t.includes("cuando es mi hora") ||
    t.includes("cuando tengo mi hora") ||
    t.includes("tengo una hora pendiente") ||
    t.includes("ya tengo hora") ||
    t.includes("ya tengo una hora") ||
    t.includes("tengo agendad") ||
    t.includes("que dia tengo") ||
    t.includes("que fecha tengo") ||
    t.includes("para cuando tengo");

  if (exactPhrase) return true;

  // Cobertura combinatoria ademas de la lista de frases exactas: cualquier
  // mensaje con una palabra de posesion (tengo/tenga, sin ser "tengo que" =
  // obligacion) junto con un sustantivo de reserva, en cualquier orden.
  // Cierra variantes/typos que no calzan con ninguna frase exacta de arriba
  // (ej. "que hora TENGA agendada", con subjuntivo/typo en vez de "tengo",
  // o el orden de palabras invertido).
  const hasPossessionWord =
    (t.includes("tengo") && !t.includes("tengo que")) ||
    t.includes("tenga") ||
    /\bmis?\b/.test(t) ||
    /\bcuales? son\b/.test(t);
  const hasBookingNoun =
    t.includes("hora") ||
    t.includes("cita") ||
    t.includes("reserva") ||
    t.includes("agendad") ||
    t.includes("turno");

  return hasPossessionWord && hasBookingNoun;
}

function formatAppointmentWhen(startAt) {
  if (!startAt) return "la fecha coordinada";
  const d = new Date(startAt);
  if (isNaN(d.getTime())) return "la fecha coordinada";
  const dateText = d.toLocaleDateString("es-CL", { timeZone: "America/Santiago", weekday: "long", day: "2-digit", month: "long" });
  const timeText = d.toLocaleTimeString("es-CL", { timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateText} a las ${timeText}`;
}

function ruleCheckExistingAppointmentStatus(ctx) {
  if (!userAsksAboutExistingAppointment(ctx.text)) return null;
  if (ctx.leadState.human_handoff === true) return null;

  // Preferir memory.active_appointments (datos reales de la tabla appointments,
  // puede haber mas de una reserva activa) sobre lead_state.booking_date/time
  // (un solo valor, se puede desincronizar si el cliente agenda 2 veces o si
  // algun decision del LLM lo pisa con datos inventados).
  const activeOnes = Array.isArray(ctx.memory?.active_appointments)
    ? ctx.memory.active_appointments
    : (ctx.memory?.last_appointment ? [ctx.memory.last_appointment] : []);

  if (activeOnes.length > 0) {
    const service = ctx.leadState.service_interest
      ? String(ctx.leadState.service_interest).replace(/_/g, " ")
      : "tu servicio agendado";

    let message;
    if (activeOnes.length === 1) {
      message = `Si, tienes una hora agendada para ${service} el ${formatAppointmentWhen(activeOnes[0].start_at)}. Si quieres, podemos reagendarla o cambiar el servicio.`;
    } else {
      const lines = activeOnes.map((a, i) => `${i + 1}. ${formatAppointmentWhen(a.start_at)}`);
      message = `Si, tienes ${activeOnes.length} horas agendadas:\n\n${lines.join("\n")}\n\nSi quieres, podemos reagendar o cambiar alguna.`;
    }

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: activeOnes.length === 1 ? "user_asked_existing_appointment_status_has_one" : "user_asked_existing_appointment_status_has_multiple",
      message,
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        last_bot_action: "answer_question",
        missing_fields: [],
      },
      ruleName: activeOnes.length === 1 ? "rule_check_existing_appointment_has_one" : "rule_check_existing_appointment_has_multiple",
      priority: 88,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "user_asked_existing_appointment_status_has_none",
    message: "No, por ahora no tienes ninguna hora agendada. Quieres que te mande los horarios disponibles para agendar?",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_check_existing_appointment_has_none",
    priority: 88,
  });
}

function getServiceDisplayName(ctx, key) {
  if (!key) return null;
  const cfg = findServiceConfigByKey(ctx, key);
  if (cfg?.name) return cfg.name;
  return String(key).replace(/_/g, " ");
}

function userWantsToChangeService(rawText) {
  const normalized = normalizeText(rawText);

  return (
    normalized.includes("cambiar mi lavado") ||
    normalized.includes("cambiar el lavado") ||
    normalized.includes("cambiar de lavado") ||
    normalized.includes("cambiar mi servicio") ||
    normalized.includes("cambiar el servicio") ||
    normalized.includes("cambiar de servicio") ||
    normalized.includes("cambiar mi reserva a") ||
    normalized.includes("cambiar la reserva a") ||
    normalized.includes("quiero cambiar a") ||
    normalized.includes("cambiar por lavado") ||
    normalized.includes("cambiar a lavado") ||
    normalized.includes("cambiar a encerado")
  );
}

function buildServiceChangeMessage(ctx, currentServiceKey, newServiceKey) {
  const currentName =
    getServiceDisplayName(ctx, currentServiceKey) || "tu servicio actual";
  const newName = getServiceDisplayName(ctx, newServiceKey) || "el nuevo servicio";

  const date = ctx.leadState.booking_date || "";
  const time = ctx.leadState.booking_time || "";
  const when = date && time ? `${date} a las ${time}` : date || time || "";
  const whenLine = when ? ` agendada para ${when}` : "";

  return `Para cambiar el servicio de tu reserva${whenLine}, necesito cancelarla y agendar una nueva con el servicio que prefieras. Tu reserva actual es de ${currentName}. Si quieres, cancelo esa reserva y avanzamos con ${newName}. Me confirmas?`;
}

function ruleChangeServiceRequiresCancelRebook(ctx) {
  if (!hasActiveAppointmentContext(ctx)) return null;
  if (!userWantsToChangeService(ctx.text)) return null;

  const newServiceKey = extractServiceInterestFromText(ctx.text);

  const appointment = getActiveAppointment(ctx);
  const currentServiceKey =
    appointment?.service_key || ctx.leadState.service_interest || null;

  if (!newServiceKey) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "service_change_requested_but_target_service_missing",
      message: "Claro, te ayudo con eso. A cual de nuestros servicios te gustaria cambiarte: " + buildServiceEnumerationText("lavado basico, lavado premium o encerado full") + "?",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        last_bot_action: "answer_question",
        intent_last: "service_change_pending",
        missing_fields: [],
      },
      ruleName: "rule_change_service_ask_target",
      priority: 89,
    });
  }

  if (currentServiceKey && currentServiceKey === newServiceKey) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "service_change_requires_cancel_and_rebook",
    message: buildServiceChangeMessage(ctx, currentServiceKey, newServiceKey),
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      intent_last: "service_change_requires_cancel_rebook",
      service_interest: newServiceKey,
      missing_fields: [],
    },
    ruleName: "rule_change_service_requires_cancel_rebook",
    priority: 89,
  });
}

function ruleServiceChangeTargetProvided(ctx) {
  if (ctx.leadState.intent_last !== "service_change_pending") return null;
  if (!hasActiveAppointmentContext(ctx)) return null;

  const newServiceKey = extractServiceInterestFromText(ctx.text);
  if (!newServiceKey) return null;

  const appointment = getActiveAppointment(ctx);
  const currentServiceKey =
    appointment?.service_key || ctx.leadState.service_interest || null;

  if (currentServiceKey && currentServiceKey === newServiceKey) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "service_change_target_provided_requires_cancel_and_rebook",
    message: buildServiceChangeMessage(ctx, currentServiceKey, newServiceKey),
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      intent_last: "service_change_requires_cancel_rebook",
      service_interest: newServiceKey,
      missing_fields: [],
    },
    ruleName: "rule_service_change_target_provided",
    priority: 89,
  });
}

function looksLikeCancelConfirmationIntent(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("cancela") ||
    t.includes("cancelar") ||
    t.includes("cancelalo") ||
    t.includes("anula") ||
    t.includes("anular") ||
    t.includes("dale cancela") ||
    t.includes("procede") ||
    t.includes("hazlo") ||
    t.includes("adelante")
  );
}


function ruleShowMeSlotsAfterQuote(ctx) {
  // Early catch: user asks to see slots after receiving a quote.
  // Must be before FAQ/availability rules that might intercept "muestrame".
  const stage = ctx.leadState.stage || "";
  const lastBotAction = ctx.leadState.last_bot_action || "";
  const isAfterQuote =
    stage === "quoted" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    lastBotAction === "send_quote_failed";
  if (!isAfterQuote) return null;

  const hasCommercialContext =
    !isMissing(ctx.leadState.service_interest) &&
    !isMissingField("vehicle_type", ctx.leadState) &&
    !isMissing(ctx.leadState.district);
  if (!hasCommercialContext) return null;

  const t = normalizeText(ctx.text);
  const asksForSlots =
    t.includes("muestrame") ||
    t.includes("ver horarios") ||
    t.includes("ver los horarios") ||
    t.includes("los horarios") ||
    t.includes("ver opciones") ||
    t.includes("las opciones") ||
    t.includes("quiero ver") ||
    t.includes("quiero agendar") ||
    t.includes("quiero reservar") ||
    t.includes("mandame los horarios") ||
    t.includes("mandame horarios") ||
    t.includes("manda los horarios") ||
    t.includes("mostrar horarios") ||
    t.includes("mostrar opciones") ||
    t.includes("mostrando");
  if (!asksForSlots) return null;

  // If payment mode requires asking, defer to ruleAskPaymentPreference
  const _pmShowSlots = (ctx.agentBusinessConfig?.config?.payment_mode) || "both";
  if (_pmShowSlots === "both" && !ctx.leadState.payment_preference) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "user_asks_to_see_slots_after_quote",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "quote_accepted_booking_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",
      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,
      missing_fields: [],
    },
    ruleName: "rule_show_me_slots_after_quote",
    priority: 91
  });
}

function ruleConfirmServiceChangeCancelAndRebook(ctx) {
  if (ctx.leadState.intent_last !== "service_change_requires_cancel_rebook") {
    return null;
  }
  if (
    !isAffirmativeReply(ctx.text) &&
    !looksLikeCancelConfirmationIntent(ctx.text)
  ) {
    return null;
  }

  // El nuevo servicio ya quedo guardado en service_interest cuando se
  // ofrecio el cambio (rule_change_service_requires_cancel_rebook /
  // rule_service_change_target_provided). No usamos un campo aparte
  // porque no existe columna propia en lead_state para eso.
  const newServiceKey = ctx.leadState.service_interest || null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "cancel_booking",
    reason: "user_confirmed_service_change_cancel_and_rebook",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "cancelling",
      intent_last: "service_change_cancelled_rebooking",
      next_goal: "cancel_active_booking",
      last_bot_action: "cancel_booking_in_progress",
      service_interest: newServiceKey,
      booking_date: null,
      booking_time: null,
      slot_id: null,
      fields_to_clear: ["booking_date", "booking_time", "slot_id"],
      auto_offer_slots_after_cancel: true,
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,
      missing_fields: [],
    },
    ruleName: "rule_confirm_service_change_cancel_and_rebook",
    priority: 90,
  });
}

function ruleVehicleRuralClarificationReplyProvided(ctx) {
  if (ctx.leadState.intent_last !== "vehicle_rural_clarification_pending") return null;

  const t = normalizeText(ctx.text);
  const bigSignals = ["grande", "familiar", "suv", "camioneta", "7 asientos", "siete asientos"];
  const isBig = bigSignals.some((key) => t.includes(key));
  const resolvedVehicleType = isBig ? "SUV" : "Auto";

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "vehicle_rural_clarification_resolved",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      vehicle_type: resolvedVehicleType,
      confirmed_vehicle_type: resolvedVehicleType,
      intent_last: "vehicle_rural_clarification_resolved",
      missing_fields: []
    },
    ruleName: "rule_vehicle_rural_clarification_resolved",
    priority: 95
  });
}
function ruleStaffSelectionReplyProvided(ctx) {
  if (ctx.leadState.intent_last !== "staff_selection_pending") return null;

  const serviceKey = ctx.leadState.service_interest || null;
  const eligibleStaff = (ctx.agentStaff || []).filter((s) => {
    if (s.is_active === false) return false;
    const services = Array.isArray(s.services) ? s.services : [];
    return services.length === 0 || !serviceKey || services.includes(serviceKey);
  });

  let picked = findStaffInReply(ctx.text, eligibleStaff);

  // "cualquiera" / "da lo mismo": el cliente delega la eleccion. Es una
  // respuesta valida a "con quien prefieres agendar?", no un fallo de
  // reconocimiento -- se asigna igual que en staff_selection_mode "auto"
  // en vez de volver a preguntar en loop.
  if (!picked && customerHasNoStaffPreference(ctx.text)) {
    picked = pickStaffAutomatically(eligibleStaff);
  }

  if (!picked) {
    const lines = eligibleStaff.map((s, i) => `${i + 1}. ${s.name}`);

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "staff_selection_reply_not_recognized",
      message: `No reconoci esa opcion. Con quien prefieres agendar?\n\n${lines.join("\n")}\n\nResponde con el nombre o el numero de la opcion.`,
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        intent_last: "staff_selection_pending",
        last_bot_action: "answer_question",
        missing_fields: [],
      },
      ruleName: "rule_staff_selection_reply_not_recognized",
      priority: 95,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "staff_selected_ready_for_slots",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      staff_id: picked.id,
      staff_name: picked.name,
      calendar_id: picked.calendar_id,
      stage: "booking_selection",
      intent_last: "availability_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,
      missing_fields: [],
    },
    ruleName: "rule_staff_selected_ready_for_slots",
    priority: 95,
  });
}
function ruleReferralIntent(ctx) {
  if (!isReferralIntent(ctx.text)) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "request_referral",
    reason: "client_wants_to_refer",
    message:
      "S, feliz. Muchas gracias por recomendarnos. Puedes compartirle nuestro WhatsApp y decirle que viene recomendado por ti para atenderlo mejor.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "post_service",
      intent_last: "referral_intent_detected",
      next_goal: "facilitate_referral",
      last_bot_action: "request_referral",
      missing_fields: [],
    },
    ruleName: "rule_referral_intent",
    priority: 91,
  });
}

function rulePositivePostServiceFeedback(ctx) {
  if (!isPositivePostServiceMessage(ctx.text)) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "request_review",
    reason: "positive_post_service_feedback",
    message:
      "Qu bueno saberlo, muchas gracias. Nos ayuda mucho tu opinin. Te gustara dejarnos una resea breve para que ms personas puedan conocer el servicio?",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "post_service",
      intent_last: "positive_post_service_feedback",
      next_goal: "request_customer_review",
      last_bot_action: "request_review",
      missing_fields: [],
    },
    ruleName: "rule_positive_post_service_feedback",
    priority: 90,
  });
}

function ruleConfirmAddressIfWaitingAddress(ctx) {
  const normalized = normalizeText(ctx.text);

  const waitingAddress =
    ctx.leadState.stage === "collecting_address" ||
    ctx.leadState.next_goal === "collect_address" ||
    ctx.leadState.last_bot_action === "collect_address";

  if (!waitingAddress) return null;

  // Si la persona quiere abandonar o no quiere seguir, no hay que repetir
  // la misma pregunta de direccion para siempre: cerramos el ciclo con
  // un handoff humano amable en vez de insistir.
  const wantsToStop = containsAny(ctx.textLower, [
    "no quiero",
    "no gracias",
    "no me interesa",
    "ya no quiero",
    "mejor no",
    "olvidalo",
    "dejalo",
    "no importa",
    "bye",
    "adios",
    "chao",
    "chau",
    "nos vemos",
    "hasta luego",
    "no se",
    "no s",
    "no tengo",
    "no tengo la",
    "no recuerdo",
    "no me acuerdo",
    "no la tengo",
    "no lo se",
    "no lo s"
  ]);

  if (wantsToStop) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "handoff_human",
      reason: "user_abandoned_address_collection",
      message: "Sin problema, no avanzo con la reserva. Si despues quieres retomarlo o prefieres hablar con una persona del equipo, aqui estamos.",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "human_handoff",
        human_handoff: true,
        next_goal: "human_takeover",
        last_bot_action: "handoff_human",
        missing_fields: [],
        address_collection_attempts: 0,
      },
      ruleName: "rule_abandon_address_collection",
      priority: 93,
    });
  }

  const attempts = Number(ctx.leadState.address_collection_attempts || 0);

  // Circuito de seguridad: si despues de varios intentos seguimos sin
  // reconocer una direccion real, dejamos de repetir la misma pregunta y
  // derivamos a una persona en vez de entrar en un loop sin salida.
  if (attempts >= 1 && !looksLikeAddress(ctx.text)) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "handoff_human",
      reason: "address_collection_attempts_exhausted",
      message: "No logro reconocer la direccion en el formato que necesito. Te voy a derivar con una persona del equipo para que te ayude a coordinar el servicio.",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "human_handoff",
        human_handoff: true,
        next_goal: "human_takeover",
        last_bot_action: "handoff_human",
        missing_fields: [],
        address_collection_attempts: 0,
      },
      ruleName: "rule_address_collection_attempts_exhausted",
      priority: 93,
    });
  }


  const looksLikeAddressButMissingNumber = (function() {
    const n2 = normalizeText(ctx.text);
    const hasNum = /[0-9]/.test(n2);
    if (hasNum) return false;
    const addrWords = ["calle","avenida","av","pasaje","camino","condominio","villa","sector","edificio","porton","calle"];
    return addrWords.some(function(w){ return n2.includes(w); });
  })();

  if (looksLikeAddressButMissingNumber) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "address_missing_number",
      message: "Parece que falta el numero de la calle. Me la mandas completa con numero? Por ejemplo: Av Providencia 1234 o Camino El Alba 500.",
      missingFields: ["address"],
      shouldCallLlm: false,
      stateUpdate: {
        last_bot_action: "collect_address",
        next_goal: "collect_address",
        address_collection_attempts: Number(ctx.leadState.address_collection_attempts || 0) + 1,
        missing_fields: ["address"]
      },
      ruleName: "rule_address_missing_number",
      priority: 88
    });
  }
    const invalidAddressReplies = [
    "si",
    "s",
    "ok",
    "dale",
    "bueno",
    "ya",
    "confirmo",
    "perfecto"
  ];

  if (invalidAddressReplies.includes(normalized)) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "collect_address",
      reason: "address_still_missing",
      message: "Perfecto. Enviame la direccion exacta donde seria el servicio, idealmente con numero y referencia.",
      missingFields: ["address"],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "collecting_address",
        next_goal: "collect_address",
        last_bot_action: "collect_address",
        missing_fields: ["address"],
        address_collection_attempts: attempts + 1,
      },
      ruleName: "rule_confirm_address_invalid_reply",
      priority: 92,
    });
  }

  if (!looksLikeAddress(ctx.text)) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "collect_address",
      reason: "address_not_clear",
      message: "Para dejarlo bien registrado, me puedes enviar la direccion exacta con numero y alguna referencia?",
      missingFields: ["address"],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "collecting_address",
        next_goal: "collect_address",
        last_bot_action: "collect_address",
        missing_fields: ["address"],
        address_collection_attempts: attempts + 1,
      },
      ruleName: "rule_confirm_address_not_clear",
      priority: 92,
    });
  }

  const pendingBookingDate = ctx.leadState.booking_date || null;
  const pendingBookingTime = ctx.leadState.booking_time || null;
  const pendingSlotId = ctx.leadState.slot_id || (pendingBookingDate && pendingBookingTime ? pendingBookingDate + "_" + pendingBookingTime : null);
  const hasPendingSlot = !!(pendingBookingDate && pendingBookingTime);

  const addressState = {
    service_address: stripAddressPrefix(ctx.text),
    address_reference: stripAddressPrefix(ctx.text),
    address_confirmed: false,
    missing_fields: [],
    address_collection_attempts: 0,

    service_interest: ctx.leadState.service_interest,
    vehicle_type: ctx.leadState.vehicle_type,
    district: ctx.leadState.district,

    booking_date: pendingBookingDate,
    booking_time: pendingBookingTime,
    slot_id: pendingSlotId,
    selected_slot: ctx.leadState.selected_slot,
    selected_booking_option: ctx.leadState.selected_booking_option,
    slot_start_at: ctx.leadState.slot_start_at,
    slot_end_at: ctx.leadState.slot_end_at,
    availability_confirmed: hasPendingSlot ? (ctx.leadState.availability_confirmed ?? true) : false,
    duration_minutes: ctx.leadState.duration_minutes,
    calendar_id: ctx.leadState.calendar_id,
    booking_options: ctx.leadState.booking_options
  };

  if (!hasPendingSlot) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "offer_available_slots",
      reason: "address_provided_without_selected_slot",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        ...addressState,
        stage: "booking_selection",
        intent_last: "address_provided_without_selected_slot",
        next_goal: "send_available_slots",
        last_bot_action: "offer_available_slots_in_progress",
        address_confirmed: true,
        availability_confirmed: false,
        booking_date: null,
        booking_time: null,
        slot_id: null,
        selected_slot: null,
        selected_booking_option: null,
        slot_start_at: null,
        slot_end_at: null,
        fields_to_clear: ["booking_date", "booking_time", "slot_id"]
      },
      ruleName: "rule_confirm_address_without_pending_slot",
      priority: 92,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "confirm_address",
    reason: "user_provided_service_address",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      ...addressState,
      stage: "address_confirmation",
      intent_last: "address_provided",
      next_goal: "validate_address",
      last_bot_action: "confirm_address_in_progress"
    },
    ruleName: "rule_confirm_address_if_waiting_address",
    priority: 92,
  });
}
function ruleRecommendServiceRequest(ctx) {
  const normalized = normalizeText(ctx.text);

  const asksRecommendation =
    normalized.includes("que me recomiendas") ||
    normalized.includes("que recomiendas") ||
    normalized.includes("cual me recomiendas") ||
    normalized.includes("cual recomiendas") ||
    normalized.includes("cual me conviene") ||
    normalized.includes("que me conviene") ||
    normalized.includes("cual es mejor") ||
    normalized.includes("que es mejor") ||
    normalized.includes("no se cual elegir") ||
    normalized.includes("no se cual tomar") ||
    normalized.includes("no se que elegir") ||
    normalized.includes("no se que servicio") ||
    normalized.includes("ayudame a elegir") ||
    normalized.includes("aydame a elegir") ||
    normalized.includes("me ayudas a elegir") ||
    normalized.includes("recomiendame") ||
    normalized.includes("recomindame");

  if (!asksRecommendation) return null;

  const missingFields = [];

  if (isMissingField("vehicle_type", ctx.leadState)) {
    missingFields.push("vehicle_type");
  }

  if (isMissing(ctx.leadState.district)) {
    missingFields.push("district");
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "recommend_service",
    reason: "user_requested_service_recommendation",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "service_discovery",
      intent_last: "service_recommendation_requested",
      next_goal: missingFields.length > 0
        ? "collect_vehicle_and_district"
        : "recommend_best_service",
      last_bot_action: "recommend_service",
      missing_fields: missingFields,

      service_interest: ctx.leadState.service_interest || null,
      vehicle_type: ctx.leadState.vehicle_type || null,
      district: ctx.leadState.district || null
    },
    ruleName: "rule_recommend_service_request",
    priority: 88,
  });
}
function rulePriceWithCompleteContextImmediate(ctx) {
  if (!userAsksPrice(ctx.text)) return null;

  // Don't re-quote for discount/special-price FAQ questions — let ruleBusinessFaqRouter handle
  const _pciNorm = normalizeText(ctx.text);
  const _pciIsDiscountQ = _pciNorm.includes("descuento") || _pciNorm.includes("precio especial") || _pciNorm.includes("promocion") || _pciNorm.includes("rebaja") || _pciNorm.includes("promo");
  if (_pciIsDiscountQ) return null;

  // Don't re-quote when user asks for cheaper alternative (e.g. "hay algo mas accesible en precio?")
  const _pciAsksCheaper = _pciNorm.includes("mas barato") || _pciNorm.includes("ms barato") ||
    _pciNorm.includes("mas economico") || _pciNorm.includes("mas economica") ||
    _pciNorm.includes("ms economico") || _pciNorm.includes("ms economica") ||
    _pciNorm.includes("mas accesible") || _pciNorm.includes("ms accesible") ||
    _pciNorm.includes("menor precio") || _pciNorm.includes("de menor precio") ||
    _pciNorm.includes("algo mas barato") || _pciNorm.includes("algo economico") ||
    _pciNorm.includes("opcion mas barata") || _pciNorm.includes("opcion economica") ||
    _pciNorm.includes("alternativa") || _pciNorm.includes("no puedo pagar");
  if (_pciAsksCheaper) return null;

  // Don't re-quote when user is confirming a booking and just mentions "precio" positively
  const _pciIsBookingSignal = isAffirmativeReply(ctx.text) || _pciNorm.includes("lo reservo") || _pciNorm.includes("quiero reservar") || _pciNorm.includes("voy a reservar") || _pciNorm.includes("vamos a reservar") || _pciNorm.includes("lo agendo") || _pciNorm.includes("agendemos") || _pciNorm.includes("quisiera reservar");
  if (_pciIsBookingSignal) return null;

  if (!isMissing(ctx.leadState.service_interest) === false) return null;
  if (isMissing(ctx.leadState.service_interest)) return null;
  if (isMissingField("vehicle_type", ctx.leadState)) return null;
  if (isMissing(ctx.leadState.district)) return null;

  const stage = ctx.leadState.stage || "";
  const forbiddenStages = [
    "booking_selection","booking_confirmation","collecting_address",
    "address_confirmation","booked","cancelling","reschedule",
    "post_service","human_handoff"
  ];
  if (forbiddenStages.indexOf(stage) !== -1) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "price_request_with_complete_context",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "qualified",
      intent_last: "quote_ready",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",
      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      missing_fields: []
    },
    ruleName: "rule_price_with_complete_context_immediate",
    priority: 87
  });
}
function ruleServiceMenuRequest(ctx) {
  const normalized = normalizeText(ctx.text);

  const asksAvailabilityOnly =
    normalized.includes("horario") ||
    normalized.includes("horarios") ||
    normalized.includes("agenda") ||
    normalized.includes("agendar") ||
    normalized.includes("hora disponible") ||
    normalized.includes("horas disponibles");

  const asksServiceMenu =
    normalized.includes("que servicios") ||
    normalized.includes("que servicio") ||
    normalized.includes("cuales servicios") ||
    normalized.includes("cual servicio") ||
    normalized.includes("cuales tiene") ||
    normalized.includes("cual tiene") ||
    normalized.includes("cuales tienes") ||
    normalized.includes("cual tienes") ||
    normalized.includes("que tiene") ||
    normalized.includes("que tienes") ||
    normalized.includes("cuales ofrecen") ||
    normalized.includes("cual ofrecen") ||
    normalized.includes("que ofrecen") ||
    normalized.includes("que lavados") ||
    normalized.includes("lavados tienen") ||
    normalized.includes("servicios disponibles") ||
    normalized.includes("opciones tienen") ||
    normalized.includes("que opciones") ||
    normalized.includes("opciones ofrecen") ||
    normalized.includes("menu de servicios") ||
    normalized.includes("lista de servicios") ||
    normalized.includes("que hacen") ||
    normalized.includes("que hay") ||
    (!asksAvailabilityOnly && normalized.includes("que esta disponible")) ||
    (!asksAvailabilityOnly && normalized.includes("que tienes disponible"));

  if (!asksServiceMenu) return null;

  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  if (hasVehicle && hasDistrict) {
    // "que servicios" pregunta por las opciones en general, no reconfirma
    // un servicio elegido antes: siempre mostramos los 3 valores.
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "send_quote",
      reason: "service_menu_requested_but_vehicle_and_district_already_known",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "qualified",
        intent_last: "price_list_ready",
        next_goal: "send_quote",
        last_bot_action: "send_quote_in_progress",
        service_interest: null,
        fields_to_clear: ["service_interest"],
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        missing_fields: [],
      },
      ruleName: "rule_service_menu_request_with_known_vehicle_district",
      priority: 88,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_service_menu",
    reason: "user_requested_service_menu",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "service_discovery",
      intent_last: "service_menu_request",
      next_goal: "collect_vehicle_and_district",
      last_bot_action: "send_service_menu",
      missing_fields: [],
    },
    ruleName: "rule_service_menu_request",
    priority: 87,
  });
}
function getServicesFromBusinessConfig(ctx) {
  const services = ctx.agentBusinessConfig?.config?.services;
  return Array.isArray(services) ? services : [];
}

function findServiceConfigByKey(ctx, key) {
  if (!key) return null;
  return getServicesFromBusinessConfig(ctx).find((s) => s.key === key) || null;
}

function ruleServiceDetails(ctx) {
  const normalized = normalizeText(ctx.text);

  const asksServiceDetails =
    normalized.includes("que trae") ||
    normalized.includes("que incluye") ||
    normalized.includes("incluye") ||
    normalized.includes("que contiene") ||
    normalized.includes("contiene") ||
    normalized.includes("en que consiste") ||
    normalized.includes("dame exactamente") ||
    normalized.includes("exactamente") ||
    normalized.includes("detalles") ||
    normalized.includes("que significa") ||
    normalized.includes("que tiene") ||
    normalized.includes("q trae") ||
    normalized.includes("q incluye");

  if (!asksServiceDetails) return null;

  const detectedKey =
    extractServiceInterestFromText(ctx.text) ||
    (ctx.leadState.service_interest || null);

  const serviceConfig = findServiceConfigByKey(ctx, detectedKey);

  if (!serviceConfig) return null;

  const vehicleType = ctx.leadState.vehicle_type || null;
  const district = ctx.leadState.district || null;

  let contextLine = "";

  if (vehicleType && district) {
    contextLine = `En tu caso, sera para ${vehicleType} en ${district}. `;
  } else if (vehicleType) {
    contextLine = `En tu caso, sera para ${vehicleType}. `;
  } else if (district) {
    contextLine = `En tu caso, sera en ${district}. `;
  }

  const includesList = Array.isArray(serviceConfig.includes)
    ? serviceConfig.includes
    : [];

  const includesBlock = includesList.length
    ? `\n\nIncluye:\n${includesList.map((item) => `- ${item}.`).join("\n")}`
    : "";

  const description = serviceConfig.description
    ? serviceConfig.description
    : `Detalles de ${serviceConfig.name || "este servicio"}.`;

  const message = `${contextLine}${serviceConfig.name || "Este servicio"}: ${description}${includesBlock}\n\nQuieres que te diga el valor?`;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "service_details_requested_from_business_config",
    message,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: ctx.leadState.stage || "qualified",
      service_interest: detectedKey,
      intent_last: "service_details_requested",
      next_goal: "quote_or_book_appointment",
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_service_details",
    priority: 85,
  });
}
function isWordBoundaryChar(ch) {
  if (!ch) return true;
  return !/[a-z0-9]/i.test(ch);
}

function includesWholeWord(text, word) {
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(word, searchFrom);
    if (idx === -1) return false;
    const beforeChar = idx > 0 ? text[idx - 1] : "";
    const afterChar = idx + word.length < text.length ? text[idx + word.length] : "";
    if (isWordBoundaryChar(beforeChar) && isWordBoundaryChar(afterChar)) {
      return true;
    }
    searchFrom = idx + 1;
  }
}
// Fase C (consolidacion multi-vertical): FAQ.
// Los 5 temas de abajo aplican a cualquier rubro (descuentos, pago, atencion,
// requisitos, duracion) -- se quedan como deteccion fija. Los temas realmente
// especificos de un rubro (moto para detailing, depilacion para salon, etc.)
// se mueven a agent_business_config.config.faq_extra_topics -- si el agente no
// tiene ese campo (caso de detailing hoy), se usa LEGACY_FAQ_EXTRA_TOPICS, que
// reproduce exactamente los 3 temas que ya existian aca (motorcycle_service,
// basic_vs_premium, service_includes), en el mismo orden -- cero regresion.
const LEGACY_FAQ_EXTRA_TOPICS = [
  {
    topic: "motorcycle_service",
    keywords: ["moto", "motos", "motocicleta", "lavado de moto", "lavan motos", "hacen motos"],
    ambiguous_short_keywords: ["moto", "motos"],
    answer: "Por ahora el foco principal esta en autos, SUV, camionetas y vehiculos similares. Si quieres lavar una moto, puedo derivarlo para revision manual y confirmar si se puede realizar. Quieres que lo revisemos?",
  },
  {
    topic: "basic_vs_premium",
    keywords: [
      "diferencia entre basico y premium", "diferencia entre el basico y el premium",
      "diferencia entre el basico y premium", "diferencia entre basico y el premium",
      "basico y premium", "el basico y el premium", "basico vs premium", "basico o premium",
      "que diferencia hay", "cual conviene",
    ],
    answer: "El lavado basico esta pensado para una mantencion general del vehiculo. El lavado premium es mas completo y se enfoca en una limpieza mas detallada interior y exterior. Si el auto necesita una limpieza mas profunda, normalmente conviene el premium. {{closing_question}}",
  },
  {
    topic: "service_includes",
    keywords: ["que incluye", "que trae", "incluye", "detalle del servicio", "que hacen en el lavado"],
    answer: "El detalle depende del servicio elegido. En general, el lavado basico cubre una limpieza de mantencion, mientras que el premium incluye una limpieza mas completa interior y exterior. {{closing_question}}",
  },
];

function getBusinessFaqExtraTopics() {
  const configured = agentBusinessConfig?.config?.faq_extra_topics;
  return Array.isArray(configured) && configured.length > 0 ? configured : LEGACY_FAQ_EXTRA_TOPICS;
}

function getBusinessFaqTopic(rawText) {
  const normalized = normalizeText(rawText);

  const faqRules = [
    {
      topic: "discounts",
      keys: ["descuento", "descuentos", "promocion", "promocin", "promo", "rebaja", "precio especial"],
    },
    {
      topic: "payment_methods",
      keys: [
        "pago", "pagar", "paga", "se paga", "transferencia", "transferir", "tarjeta",
        "efectivo", "debito", "dbito", "credito", "crdito", "medio de pago",
        "forms de pago", "metodo de pago", "mtodo de pago",
      ],
      // Do not match when text names a payment platform — those are preference selections, not FAQ inquiries
      negativeKeys: ["flow", "prepago", "link de pago", "pagar online", "pago online", "webpay", "con link", "por link"],
    },
    {
      topic: "home_service",
      keys: [
        "domicilio", "a domicilio", "van a la casa", "atienden en casa", "atienden en domicilio",
        "pueden venir", "vienen a mi casa", "servicio en casa", "servicio movil", "servicio mvil",
        "local", "tienen local", "tienen sede", "tienen sucursal", "donde atienden",
        "donde trabajan", "donde quedan", "tienen local fisico", "tienen oficina",
      ],
    },
    {
      topic: "requirements",
      keys: [
        "agua", "luz", "electricidad", "enchufe", "necesitan agua", "necesitan luz",
        "tengo que poner agua", "tengo que poner luz", "requisitos", "que necesitan", "qu necesitan",
      ],
    },
    {
      topic: "service_duration",
      keys: [
        "cuanto se demoran", "cuanto demora", "duracion", "duracin", "cuanto tarda",
        "tiempo toma", "cuanto tiempo",
      ],
    },
  ];

  const ambiguousShortKeys = [];

  for (const extra of getBusinessFaqExtraTopics()) {
    faqRules.push({ topic: extra.topic, keys: Array.isArray(extra.keywords) ? extra.keywords : [] });
    if (Array.isArray(extra.ambiguous_short_keywords)) {
      for (const k of extra.ambiguous_short_keywords) ambiguousShortKeys.push(normalizeText(k));
    }
  }

  const found = faqRules.find(rule => {
    if (!rule.keys.some(key => {
      const normalizedKey = normalizeText(key);
      if (ambiguousShortKeys.indexOf(normalizedKey) !== -1) {
        return includesWholeWord(normalized, normalizedKey);
      }
      return normalized.includes(normalizedKey);
    })) return false;
    if (rule.negativeKeys && rule.negativeKeys.some(k => normalized.includes(normalizeText(k)))) return false;
    return true;
  });

  return found ? found.topic : null;
}

function buildBusinessFaqMessage(topic, ctx) {
  const hasService = !isMissing(ctx.leadState.service_interest);
  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  const hasFullCommercialContext = hasService && hasVehicle && hasDistrict;

  const closingQuestion = hasFullCommercialContext
    ? "Te gustara que revise el valor o los horarios disponibles?"
    : "Para orientarte mejor, dime que servicio te interesa, que tipo de vehiculo tienes y en que comuna sera.";

  const detectedServiceKey =
    extractServiceInterestFromText(ctx.text) || (ctx.leadState.service_interest || null);
  const detectedServiceConfig = findServiceConfigByKey(ctx, detectedServiceKey);
  const allServicesForDuration = getServicesFromBusinessConfig(ctx);

  const serviceDurationMessage =
    detectedServiceConfig && detectedServiceConfig.duration_minutes
      ? `${detectedServiceConfig.name || "Ese servicio"} toma aproximadamente ${detectedServiceConfig.duration_minutes} minutos. ${closingQuestion}`
      : allServicesForDuration.length > 0
        ? `Los tiempos varian segun el servicio: ${allServicesForDuration.map((s) => `${s.name || s.key}${s.duration_minutes ? " (" + s.duration_minutes + " min)" : ""}`).join(", ")}. ${closingQuestion}`
        : `La duracion depende del servicio elegido. ${closingQuestion}`;

  // payment_methods: se deriva de payment_mode (ya existente, leido igual en
  // ruleAskPaymentPreference/ruleCheckPaymentStatus) en vez de un texto fijo que
  // hoy esta desactualizado -- dice "no aceptamos tarjeta" pese a que Flow.cl ya
  // permite pago online. Bug de contenido real, se corrige de paso.
  const _faqPaymentMode = (ctx.agentBusinessConfig?.config?.payment_mode) || "both";
  const paymentMethodsMessage =
    _faqPaymentMode === "postpago_only"
      ? "Por ahora el pago es al finalizar el servicio, en efectivo o transferencia."
      : (_faqPaymentMode === "prepago_only" || _faqPaymentMode === "prepago_required")
        ? "El pago se realiza online por adelantado, a traves de un link de pago seguro (Flow)."
        : "Puedes pagar al finalizar el servicio (efectivo o transferencia), o por adelantado con un link de pago online (Flow). Tu eliges.";

  // home_service: se deriva de service_location.mode (nuevo, sin valor hoy para
  // ningun agente -- por default asume "a domicilio", el comportamiento actual).
  const _faqServiceLocationMode = ctx.agentBusinessConfig?.config?.service_location?.mode || "at_customer_address";
  const homeServiceMessage =
    _faqServiceLocationMode === "at_business_location"
      ? `No, atendemos en nuestro local. ${closingQuestion}`
      : `Si, el servicio es a domicilio. Vamos hasta la direccion que nos indiques y coordinamos el horario segun disponibilidad. ${closingQuestion}`;

  const messages = {
    payment_methods: paymentMethodsMessage,
    home_service: homeServiceMessage,

    requirements:
      `Para realizar el servicio idealmente necesitamos acceso a agua y electricidad cerca del vehiculo. Si tienes alguna limitacion en el lugar, me la comentas y lo revisamos antes de agendar. ${closingQuestion}`,

    service_duration: serviceDurationMessage,

    discounts:
      `Por ahora trabajamos con valores segun servicio, tipo de vehiculo y comuna. Si son mas vehiculos o quieres agendar mas de un servicio, podemos revisarlo como caso especial. ${closingQuestion}`,
  };

  if (messages[topic]) return messages[topic];

  const extraTopic = getBusinessFaqExtraTopics().find((t) => t.topic === topic);
  if (extraTopic && extraTopic.answer) {
    return extraTopic.answer.replace("{{closing_question}}", closingQuestion);
  }

  return null;
}

function ruleWeekdayAvailabilityQuestion(ctx) {
  const t = normalizeText(ctx.text);

  const weekdayMap = [
    { day: 0, keys: ["domingo", "domingos"] },
    { day: 1, keys: ["lunes"] },
    { day: 2, keys: ["martes"] },
    { day: 3, keys: ["miercoles", "miercole"] },
    { day: 4, keys: ["jueves"] },
    { day: 5, keys: ["viernes"] },
    { day: 6, keys: ["sabado", "sabados"] }
  ];

  const availabilityQuestion = [
    "atienden", "trabajan", "hay servicio", "hay horario", "hay atencion",
    "abren", "tienen horario", "tienen servicio", "atienden en"
  ].some(function(kw) { return t.includes(kw); });

  if (!availabilityQuestion) return null;

  if (userAsksPrice(ctx.text)) return null;

  let matchedDay = null;
  for (const entry of weekdayMap) {
    if (entry.keys.some(function(k) { return t.includes(k); })) {
      matchedDay = entry.day;
      break;
    }
  }

  if (matchedDay === null) return null;

  const schedule = Array.isArray(ctx.agentBusinessConfig && ctx.agentBusinessConfig.config && ctx.agentBusinessConfig.config.schedule)
    ? ctx.agentBusinessConfig.config.schedule
    : [];

  const dayNames = ["domingos", "lunes", "martes", "miercoles", "jueves", "viernes", "sabados"];
  const dayLabel = dayNames[matchedDay];

  const hasService = schedule.some(function(s) {
    return Array.isArray(s.days) && s.days.indexOf(matchedDay) !== -1;
  });

  let message;
  if (hasService) {
    const slot = schedule.find(function(s) { return Array.isArray(s.days) && s.days.indexOf(matchedDay) !== -1; });
    const hours = slot ? " (de " + slot.start_time + " a " + slot.end_time + ")" : "";
    message = "Si, atendemos los " + dayLabel + hours + ". Si quieres, elige ese horario con el numero de la opcion correspondiente o dime otra fecha.";
  } else {
    message = "Por ahora no tenemos horarios los " + dayLabel + ". Te puedo mostrar disponibilidad en otros dias si lo prefieres.";
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "weekday_availability_question",
    message: message,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: []
    },
    ruleName: "rule_weekday_availability_question",
    priority: 86
  });
}
function ruleBusinessFaqRouter(ctx) {
  // Don't route to FAQ when user asks for cheaper alternative (e.g. "no puedo pagar eso, hay algo mas barato?")
  const _faqNorm = normalizeText(ctx.text);
  const _asksCheaper = _faqNorm.includes("mas barato") || _faqNorm.includes("ms barato") ||
    _faqNorm.includes("mas economico") || _faqNorm.includes("ms economico") ||
    _faqNorm.includes("mas accesible") || _faqNorm.includes("ms accesible") ||
    _faqNorm.includes("opcion economica") || _faqNorm.includes("opcin econmica") ||
    _faqNorm.includes("algo economico") || _faqNorm.includes("algo barato") ||
    _faqNorm.includes("alternativa") || _faqNorm.includes("no puedo pagar");
  if (_asksCheaper) return null;

  const topic = getBusinessFaqTopic(ctx.text);

  if (!topic) return null;

  const message = buildBusinessFaqMessage(topic, ctx);

  if (!message) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: `business_faq_${topic}`,
    message,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: ctx.leadState.stage || "service_discovery",
      intent_last: `business_faq_${topic}`,
      next_goal: "continue_commercial_conversation",
      last_bot_action: "answer_question",
      missing_fields: [],
      faq_topic: topic
    },
    ruleName: "rule_business_faq_router",
    priority: 84,
  });
}

function getCoverageDistricts(ctx) {
  const districts = ctx.agentBusinessConfig?.config?.coverage?.districts;
  return Array.isArray(districts) ? districts : [];
}

function userAsksCoverage(rawText) {
  const t = normalizeText(rawText);

  return (
    t.includes("llegan a") ||
    t.includes("llegan hasta") ||
    t.includes("tienen cobertura") ||
    t.includes("hay cobertura") ||
    t.includes("cobertura en") ||
    t.includes("atienden en") ||
    t.includes("trabajan en") ||
    t.includes("hacen servicio en") ||
    t.includes("hacen servicios en") ||
    t.includes("dan servicio en") ||
    t.includes("tienen servicio en") ||
    t.includes("van hasta") ||
    t.includes("cubren") ||
    t.includes("zonas de cobertura") ||
    t.includes("en que comunas") ||
    t.includes("en que ciudades") ||
    t.includes("en que regiones") ||
    t.includes("a que comunas") ||
    t.includes("a que ciudades")
  );
}

function ruleCoverageQuestion(ctx) {
  if (!userAsksCoverage(ctx.text)) return null;

  const districts = getCoverageDistricts(ctx);
  if (!districts.length) return null;

  const normalized = normalizeText(ctx.text);

  const mentionedDistrict = districts.find((d) =>
    normalized.includes(normalizeText(d))
  );

  const districtsList = districts.join(", ");

  let message;

  if (mentionedDistrict) {
    message = `Si, llegamos a ${mentionedDistrict}. Trabajamos en la Region Metropolitana (Santiago), en estas comunas: ${districtsList}.`;
  } else {
    message = `Por ahora solo cubrimos la Region Metropolitana (Santiago), en estas comunas: ${districtsList}. Si tu direccion esta en alguna de ellas, te puedo ayudar a agendar.`;
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: mentionedDistrict ? "coverage_question_district_covered" : "coverage_question_outside_coverage",
    message,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: ctx.leadState.stage || "service_discovery",
      intent_last: "coverage_question_answered",
      next_goal: "continue_commercial_conversation",
      last_bot_action: "answer_question",
      missing_fields: [],
    },
    ruleName: "rule_coverage_question",
    priority: 84,
  });
}
function isAffirmativeReply(rawText) {
  const normalized = normalizeText(rawText);
  const t = normalized.replace(/[,.;!?]+/g, " ").replace(/\s+/g, " ").trim();

  if (
    t === "si" || t === "sí" || t === "s" || t === "ok" || t === "dale" ||
    t === "bueno" || t === "perfecto" || t === "ya" || t === "agendemos" ||
    t === "agendar" || t === "agenda" || t === "agendalo" || t === "agndalo" ||
    t === "claro" || t === "listo" || t === "genial" || t === "excelente" ||
    t === "joya" || t === "chevere" || t === "bacano" ||
    t === "adelante" || t === "confirmo" || t === "trato" ||
    t === "voy"
  ) return true;

  return (
    t.includes("si quiero") ||
    t.includes("sí quiero") ||
    t.includes("s quiero") ||
    t.includes("quiero agendar") ||
    t.includes("me interesa agendar") ||
    t.includes("dale agendemos") ||
    t.includes("dale agenda") ||
    t.includes("agendemos") ||
    t.includes("si dale") ||
    t.includes("sí dale") ||
    t.includes("si perfecto") ||
    t.includes("sí perfecto") ||
    t.includes("ok si") ||
    t.includes("ok sí") ||
    t.includes("dale si") ||
    t.includes("dale sí") ||
    t.includes("si por favor") ||
    t.includes("sí por favor") ||
    t.includes("si claro") ||
    t.includes("sí claro") ||
    t.includes("claro si") ||
    t.includes("claro sí") ||
    t.includes("si listo") ||
    t.includes("sí listo") ||
    t.includes("listo si") ||
    t.includes("ok dale") ||
    t.includes("dale ok") ||
    t.includes("ya dale") ||
    t.includes("dale me interesa") ||
    t.includes("dale vamos") ||
    t.includes("agendo") ||
    t.includes("lo agendo") ||
    t.includes("lo reservo") ||
    t.includes("quiero reservar") ||
    t.includes("voy a reservar") ||
    t.includes("lo voy a reservar") ||
    t.includes("vamos a reservar") ||
    t.includes("quisiera reservar") ||
    t.includes("me gustaria reservar") ||
    t.includes("me convence") ||
    t.includes("me interesa reservar") ||
    t.includes("agendame") ||
    t.includes("me quedo con ese") ||
    t.includes("me quedo con eso") ||
    t.includes("quedo con ese") ||
    t.includes("me lo quedo") ||
    t.includes("es perfecto") ||
    t.includes("esta perfecto") ||
    t.includes("suena perfecto") ||
    t.includes("se ve perfecto") ||
    t.includes("me parece bien") ||
    t.includes("me parece perfecto") ||
    t.includes("vamos pa eso") ||
    t.includes("vamos para eso") ||
    t.includes("arranquemos") ||
    t.includes("dale perfecto") ||
    t.includes("perfecto dale") ||
    t.includes("mandame una hora") ||
    t.includes("mandame un horario") ||
    t.includes("mandame horario") ||
    t === "va" ||
    t.includes("me decido") ||
    t.includes("me anoto") ||
    t.includes("esta re bien") ||
    t.includes("esta re") ||
    t.includes("que bueno") ||
    t.includes("me apunto") ||
    t.includes("adelante") ||
    t.includes("confirmo") ||
    t.includes("trato hecho") ||
    t.includes("de acuerdo") ||
    t.includes("sin problema") ||
    t.includes("va bien") ||
    t.includes("todo bien") ||
    t.includes("pero va") ||
    t.includes("igual va") ||
    t.includes("igual dale") ||
    t.includes("igual si") ||
    t.includes("igual sí") ||
    t.includes("pero dale") ||
    t.includes("pero si") ||
    t.includes("pero sí") ||
    t.includes("lo quiero") ||
    t === "me interesa" || t.includes("si me interesa") ||
    t.includes("dale lo") ||
    t.includes("me interesa") ||
    t.includes("si vamos") ||
    t.includes("dale me anoto") ||
    t.includes("apuntame") ||
    t.includes("si bueno") ||
    t.includes("sí bueno") ||
    t.includes("ya bueno") ||
    t.includes("bueno vamos") ||
    t.includes("ok bueno") ||
    t.includes("lo hago") ||
    t.includes("si lo") ||
    t.includes("ya lo") ||
    t.includes("bueno lo") ||
    t.includes("lo pago") ||
    t.includes("va a ser")
  );
}

function ruleAffirmativeAfterPriceListAskService(ctx) {
  // Skip if already in a booking stage with slots available
  const stage = ctx.leadState.stage || "";
  if (["booking_selection","collecting_address","booking_confirmation","booked"].includes(stage)) return null;
  if (stage === "quoted" && (ctx.leadState.booking_options || []).length > 0) return null;

  // Must be a bare affirmative
  if (!isAffirmativeReply(ctx.text)) return null;

  // Must have price inquiry context (includes price_list_requested — bot asked for vehicle/district)
  const intentLast = ctx.leadState.intent_last || "";
  const lastBotAction = ctx.leadState.last_bot_action || "";
  const isPriceContext =
    intentLast === "price_list_requested" ||
    intentLast === "price_list_ready" ||
    intentLast === "price_list_service_selection_pending" ||
    intentLast === "quote_sent" ||
    lastBotAction === "send_quote_in_progress" ||
    lastBotAction === "send_quote" ||
    stage === "quoted";
  if (!isPriceContext) return null;

  // Check what's still missing
  const hasMissingService = isMissing(ctx.leadState.service_interest);
  const hasMissingVehicle = isMissingField("vehicle_type", ctx.leadState);
  const hasMissingDistrict = isMissing(ctx.leadState.district);

  // Everything present — let ruleQuoteAcceptedOfferSlots / ruleConfirmBookingFromUserConfirmation handle it
  if (!hasMissingService && !hasMissingVehicle && !hasMissingDistrict) return null;

  // Build context-aware message and missing fields list
  let message;
  const missingFields = [];
  let nextGoal;

  if (hasMissingVehicle && hasMissingDistrict && hasMissingService) {
    missingFields.push("vehicle_type", "district", "service_interest");
    message = "Con gusto te ayudo. Para mandarte el precio necesito 2 datos: ¿qué tipo de vehículo tienes (" + buildVehicleCategoriesPrompt("sedan, SUV o camioneta") + ") y en qué comuna sería el servicio?";
    nextGoal = "collect_vehicle_type";
  } else if (hasMissingVehicle && hasMissingDistrict) {
    const svcName = String(ctx.leadState.service_interest || "el servicio").replace(/_/g, " ");
    missingFields.push("vehicle_type", "district");
    message = "Perfecto. Para cotizar el " + svcName + ", dime: ¿qué vehículo tienes (" + buildVehicleCategoriesPrompt("sedan, SUV o camioneta") + ") y en qué comuna?";
    nextGoal = "collect_vehicle_type";
  } else if (hasMissingVehicle) {
    missingFields.push("vehicle_type");
    message = "Perfecto. ¿Qué tipo de vehículo tienes: " + buildVehicleCategoriesPrompt("sedan, SUV o camioneta") + "?";
    nextGoal = "collect_vehicle_type";
  } else if (hasMissingDistrict) {
    missingFields.push("district");
    message = "Perfecto. ¿En qué comuna sería el servicio?";
    nextGoal = "collect_district";
  } else {
    // Only service is missing
    missingFields.push("service_interest");
    message = "Perfecto. ¿Cuál de estos te interesa: " + buildServiceEnumerationText("lavado básico, lavado premium o encerado full") + "? Apenas me digas, te paso los horarios disponibles.";
    nextGoal = "collect_service_interest";
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "affirmative_after_price_inquiry_continue_context",
    message: message,
    missingFields: missingFields,
    shouldCallLlm: false,
    stateUpdate: {
      missing_fields: missingFields,
      last_bot_action: "ask_missing_data",
      intent_last: "price_list_service_selection_pending",
      next_goal: nextGoal
    },
    ruleName: "rule_affirmative_after_price_list_ask_service",
    priority: 87
  });
}

function ruleServiceSelectedAfterPriceList(ctx) {
  const intentLast = ctx.leadState.intent_last || "";
  // Also accept "quote_sent" — action_executor overwrites price_list_ready to quote_sent after sending the price list
  // But only when message explicitly names a service (to avoid firing on FAQ/payment questions)
  if (intentLast === "quote_sent") {
    const _ssNorm = normalizeText(ctx.text);
    const _mentionsService = _ssNorm.includes("basico") || _ssNorm.includes("premium") || _ssNorm.includes("encerado") || _ssNorm.includes("lavado");
    if (!_mentionsService) return null;
  } else if (intentLast !== "price_list_service_selection_pending" && intentLast !== "price_list_ready") {
    return null;
  }

  const hasService = !isMissing(ctx.leadState.service_interest);
  if (!hasService) return null;

  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  if (!hasVehicle || !hasDistrict) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "service_selected_after_price_list_ready_for_slots",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "service_selected_after_price_list",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,

      missing_fields: [],
    },
    ruleName: "rule_service_selected_after_price_list",
    priority: 87,
  });
}
function rulePaymentPreferenceSelected(ctx) {
  const _rpsAction = ctx.leadState.last_bot_action || "";
  const _rpsIsPaymentAsk = _rpsAction === "ask_payment_preference";
  // Also intercept when user names a payment method in booking states (e.g. "pago con flow" after slot offer)
  const _rpsIsBookingAdjacent = ["offer_available_slots","offer_available_slots_in_progress","slots_sent","booking_options_sent","send_available_slots_in_progress"].includes(_rpsAction);
  if (!_rpsIsPaymentAsk && !_rpsIsBookingAdjacent) return null;

  const t = normalizeText(ctx.text);

  const isPrepago =
    t === "ahora" ||
    t.includes("ahora") ||
    t.includes("link") ||
    t.includes("pagar ahora") ||
    t.includes("prepago") ||
    t.includes("con link") ||
    t.includes("por link") ||
    t.includes("online") ||
    t.includes("tarjeta") ||
    t.includes("webpay") ||
    t.includes("flow") ||
    t.includes("pago digital") ||
    t.includes("pago en linea") ||
    t.includes("pagar en linea") ||
    t.includes("en linea") ||
    t.includes("quiero pagar ya") ||
    t.includes("pago ahora") ||
    t.includes("pagar ahora") ||
    t.includes("quiero pagar") ||
    t.includes("debito") ||
    t.includes("con debito") ||
    t.includes("tarjeta debito");

  const isPostpago =
    t === "despues" ||
    t === "al final" ||
    t === "al terminar" ||
    t.includes("despues") ||
    t.includes("al terminar") ||
    t.includes("al final") ||
    t.includes("efectivo") ||
    t.includes("transferencia") ||
    t.includes("postpago") ||
    t.includes("cuando termine") ||
    t.includes("luego") ||
    t.includes("al servicio") ||
    t.includes("cuando hagas") ||
    t.includes("cuando llegue") ||
    t.includes("al llegar") ||
    t.includes("a la hora") ||
    t.includes("al momento") ||
    t.includes("en el momento") ||
    t.includes("al contado") ||
    t.includes("en contado") ||
    t.includes("pago contado") ||
    t.includes("transfiero") ||
    t.includes("lo transfiero") ||
    t.includes("pago ahi") ||
    t.includes("te lo pago ahi");

  const preference = isPrepago ? "prepago" : isPostpago ? "postpago" : null;

  // In booking-adjacent states: only fire if the user explicitly named a payment method.
  // If the text doesn't resolve to a preference, let other rules handle it (e.g. ruleSelectOfferedSlot).
  if (_rpsIsBookingAdjacent && !_rpsIsPaymentAsk && !preference) return null;

  if (!preference) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_payment_preference",
      reason: "payment_preference_response_unclear",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: ctx.leadState.stage || "quoted",
        intent_last: "payment_preference_asked",
        next_goal: "collect_payment_preference",
        last_bot_action: "ask_payment_preference",
        service_interest: ctx.leadState.service_interest,
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        missing_fields: [],
      },
      ruleName: "rule_payment_preference_unclear",
      priority: 91,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: preference === "prepago" ? "user_selected_prepago_offer_slots" : "user_selected_postpago_offer_slots",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "quote_accepted_booking_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",
      payment_preference: preference,
      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,
      missing_fields: [],
    },
    ruleName: preference === "prepago" ? "rule_payment_preference_prepago" : "rule_payment_preference_postpago",
    priority: 91,
  });
}
function ruleCheckPaymentStatus(ctx) {
  const t = normalizeText(ctx.text);

  const explicitPaymentStatusPhrase =
    t.includes("ya pague") ||
    t.includes("ya pagu") ||
    t.includes("ya hice el pago") ||
    t.includes("ya realice el pago") ||
    t.includes("acabo de pagar") ||
    t.includes("recien pague") ||
    t.includes("recien pagu") ||
    t.includes("confirmaron mi pago") ||
    t.includes("se registro mi pago") ||
    t.includes("verificaste mi pago") ||
    t.includes("revisaste mi pago") ||
    t.includes("verificar mi pago") ||
    t.includes("revisar mi pago") ||
    t.includes("chequear mi pago") ||
    t.includes("puedes verificar mi pago") ||
    t.includes("puedes confirmar mi pago") ||
    t.includes("mi pago esta confirmado") ||
    t.includes("esta confirmado mi pago") ||
    t.includes("llego mi pago") ||
    t.includes("recibieron mi pago") ||
    t.includes("estado de mi pago") ||
    t.includes("mi pago ya se proceso") ||
    t.includes("ya se registro el pago") ||
    t.includes("el pago ya esta") ||
    t.includes("les llego el pago");

  // Cobertura generica ademas de la lista de frases exactas: cualquier mensaje
  // que mencione pago/pagar junto con una senal de consulta de estado
  // (llego, confirmaron, revisaron, etc.), para no depender de que el usuario
  // calce una frase exacta. Caso real que se nos escapo: "Te llego el pago?"
  // (no tenia "mi" ni "les", asi que ninguna frase de la lista de arriba matcheaba).
  const mentionsPayment = /\bpag/.test(t);
  const statusInquirySignal =
    t.includes("llego") ||
    t.includes("llegue") ||
    t.includes("confirm") ||
    t.includes("revis") ||
    t.includes("verific") ||
    t.includes("recib") ||
    t.includes("registr") ||
    t.includes("proces") ||
    t.includes("acredit") ||
    t.includes("chequ") ||
    t.includes("estado") ||
    t.includes("quedo");

  const asksPaymentStatus =
    explicitPaymentStatusPhrase || (mentionsPayment && statusInquirySignal);
  if (!asksPaymentStatus) return null;

  if (!ctx.leadState.flow_order_id) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "payment_status_checked_but_no_order_found",
      message: "No tengo ningun pago pendiente registrado a tu nombre.",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: { last_bot_action: "answer_question" },
      ruleName: "rule_check_payment_status_no_order",
      priority: 92
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "check_payment_status",
    reason: "user_requested_payment_status_verification",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {},
    ruleName: "rule_check_payment_status",
    priority: 92
  });
}

function ruleAskPaymentPreference(ctx) {
  const userAccepted = isAffirmativeReply(ctx.text);
  if (!userAccepted) return null;

  const hasCommercialContext =
    !isMissing(ctx.leadState.service_interest) &&
    !isMissingField("vehicle_type", ctx.leadState) &&
    !isMissing(ctx.leadState.district);

  if (!hasCommercialContext) return null;

  const lastBotAction = ctx.leadState.last_bot_action || "";
  const nextGoal = ctx.leadState.next_goal || "";
  const stage = ctx.leadState.stage || "";

  const isAfterQuote =
    stage === "quoted" ||
    nextGoal === "book_appointment" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    lastBotAction === "send_quote_failed";

  if (!isAfterQuote) return null;
  if (ctx.leadState.payment_preference) return null;

  // Read payment_mode from agent business config
  const paymentMode = (
    ctx.agentBusinessConfig &&
    ctx.agentBusinessConfig.config &&
    ctx.agentBusinessConfig.config.payment_mode
  ) || "both";

  // postpago_only: auto-select postpago, skip question, go straight to slots
  if (paymentMode === "postpago_only") {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "offer_available_slots",
      reason: "payment_mode_postpago_only_auto_select",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "booking_selection",
        intent_last: "quote_accepted_booking_requested",
        next_goal: "send_available_slots",
        last_bot_action: "offer_available_slots_in_progress",
        payment_preference: "postpago",
        payment_mode: "postpago_only",
        service_interest: ctx.leadState.service_interest,
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        availability_window: "this_week",
        availability_label: "los proximos dias",
        days_ahead: 7, start_offset_days: 0, max_slots: 3,
        missing_fields: [],
      },
      ruleName: "rule_payment_mode_postpago_only",
      priority: 91,
    });
  }

  // prepago_only: auto-select prepago, skip question, go to slots (link sent AFTER booking)
  if (paymentMode === "prepago_only") {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "offer_available_slots",
      reason: "payment_mode_prepago_only_auto_select",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "booking_selection",
        intent_last: "quote_accepted_booking_requested",
        next_goal: "send_available_slots",
        last_bot_action: "offer_available_slots_in_progress",
        payment_preference: "prepago",
        payment_mode: "prepago_only",
        service_interest: ctx.leadState.service_interest,
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        availability_window: "this_week",
        availability_label: "los proximos dias",
        days_ahead: 7, start_offset_days: 0, max_slots: 3,
        missing_fields: [],
      },
      ruleName: "rule_payment_mode_prepago_only",
      priority: 91,
    });
  }

  // prepago_required: auto-select prepago, skip question, go to slots
  // action_executor will skip GCal until payment confirmed via 6.27 webhook
  if (paymentMode === "prepago_required") {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "offer_available_slots",
      reason: "payment_mode_prepago_required_auto_select",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "booking_selection",
        intent_last: "quote_accepted_booking_requested",
        next_goal: "send_available_slots",
        last_bot_action: "offer_available_slots_in_progress",
        payment_preference: "prepago",
        payment_mode: "prepago_required",
        service_interest: ctx.leadState.service_interest,
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        availability_window: "this_week",
        availability_label: "los proximos dias",
        days_ahead: 7, start_offset_days: 0, max_slots: 3,
        missing_fields: [],
      },
      ruleName: "rule_payment_mode_prepago_required",
      priority: 91,
    });
  }

  // both (default): check if user already stated payment preference inline
  {
    const _rapT = normalizeText(ctx.text);
    const _rapIsPrep =
      _rapT.includes("con link") || _rapT.includes("por link") ||
      _rapT.includes("con flow") || _rapT.includes("flow") ||
      _rapT.includes("pagar ahora") || _rapT.includes("pago ahora") ||
      _rapT.includes("quiero pagar") || _rapT.includes("pago online") ||
      _rapT.includes("webpay") || _rapT.includes("tarjeta") ||
      _rapT.includes("prepago") || _rapT.includes("debito") ||
      _rapT.includes("link de pago") || _rapT.includes("mandame el link");
    const _rapIsPost =
      _rapT.includes("efectivo") || _rapT.includes("transferencia") ||
      _rapT.includes("al terminar") || _rapT.includes("al llegar") ||
      _rapT.includes("cuando llegue") || _rapT.includes("cuando termines") ||
      _rapT.includes("cuando llegues") || _rapT.includes("al terminar el servicio") ||
      _rapT.includes("despues") || _rapT.includes("postpago") ||
      _rapT.includes("al final") || _rapT.includes("en el momento") ||
      _rapT.includes("al contado") || _rapT.includes("pago contado") ||
      _rapT.includes("al momento") || _rapT.includes("cuando hagas") ||
      _rapT.includes("luego pago") || _rapT.includes("pago luego") ||
      _rapT.includes("pago al llegar") || _rapT.includes("pago al terminar") ||
      _rapT.includes("agendame al terminar") || _rapT.includes("en efectivo") ||
      _rapT.includes("dale agendo en efectivo") || _rapT.includes("pago cuando llegues") ||
      _rapT.includes("transfiero") || _rapT.includes("lo transfiero") ||
      _rapT.includes("pago ahi") || _rapT.includes("pago al final");
    if (_rapIsPrep || _rapIsPost) {
      const _rapPref = _rapIsPrep ? "prepago" : "postpago";
      return buildRuleResult({
        resolutionType: "rule_based",
        action: "offer_available_slots",
        reason: "user_accepted_and_stated_payment_preference_inline",
        message: "",
        missingFields: [],
        shouldCallLlm: false,
        stateUpdate: {
          stage: "booking_selection",
          intent_last: "quote_accepted_booking_requested",
          next_goal: "send_available_slots",
          last_bot_action: "offer_available_slots_in_progress",
          payment_preference: _rapPref,
          service_interest: ctx.leadState.service_interest,
          vehicle_type: ctx.leadState.vehicle_type,
          district: ctx.leadState.district,
          availability_window: "this_week",
          availability_label: "los proximos dias",
          days_ahead: 7, start_offset_days: 0, max_slots: 3,
          missing_fields: [],
        },
        ruleName: "rule_ask_payment_pref_inline_detected",
        priority: 91,
      });
    }
  }
  // both: ask client to choose
  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_payment_preference",
    reason: "user_accepted_quote_payment_preference_unknown",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "quoted",
      intent_last: "payment_preference_asked",
      next_goal: "collect_payment_preference",
      last_bot_action: "ask_payment_preference",
      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      missing_fields: [],
    },
    ruleName: "rule_ask_payment_preference",
    priority: 91,
  });
}
function ruleImplicitAffirmationWithPayment(ctx) {
  // FIX F: fires when user expresses payment preference right after a quote,
  // treating it as an implicit booking affirmation (skips ask_payment_preference step)
  const isAfterQuote =
    ctx.leadState.last_bot_action === "send_quote_in_progress" ||
    ctx.leadState.last_bot_action === "send_quote_failed" ||
    ctx.leadState.stage === "quoted";
  if (!isAfterQuote) return null;
  if (ctx.leadState.payment_preference) return null;
  const bkStages = ["booking_selection","booking_confirmation","collecting_address","booked","post_service"];
  if (bkStages.includes(ctx.leadState.stage)) return null;
  const hasService = !isMissing(ctx.leadState.service_interest);
  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);
  if (!hasService || !hasVehicle || !hasDistrict) return null;

  const _pmt = normalizeText(ctx.text);

  // FIX H: skip when user is ASKING about payment options, not stating a preference
  const _isPayQuestion =
    _pmt.startsWith("se puede") || _pmt.startsWith("puedo pagar") ||
    _pmt.startsWith("puedo ") || _pmt.startsWith("es posible") ||
    _pmt.startsWith("podria") || _pmt.startsWith("podrian") ||
    _pmt.startsWith("aceptan") || _pmt.startsWith("acepta") ||
    _pmt.startsWith("tienen ") || _pmt.startsWith("como pago") ||
    _pmt.startsWith("se acepta") || _pmt.startsWith("que metodos") ||
    _pmt.startsWith("que formas") || _pmt.startsWith("cuales son");
  if (_isPayQuestion) return null;

  const _pmIsPrep =
    _pmt.includes("con link") || _pmt.includes("por link") ||
    _pmt.includes("con flow") || _pmt.includes("pago flow") ||
    _pmt.includes("por flow") || _pmt.includes("flow") ||
    _pmt.includes("pagar ahora") || _pmt.includes("pago ahora") ||
    _pmt.includes("pago online") || _pmt.includes("webpay") ||
    _pmt.includes("tarjeta") || _pmt.includes("prepago") ||
    _pmt.includes("debito") || _pmt.includes("link de pago") ||
    _pmt.includes("mandame el link") || _pmt.includes("quiero pagar");
  const _pmIsPost =
    _pmt.includes("efectivo") || _pmt.includes("transferencia") ||
    _pmt.includes("al terminar") || _pmt.includes("al llegar") ||
    _pmt.includes("cuando llegue") || _pmt.includes("cuando termines") ||
    _pmt.includes("cuando llegues") || _pmt.includes("postpago") ||
    _pmt.includes("al final") || _pmt.includes("en el momento") ||
    _pmt.includes("al contado") || _pmt.includes("cuando hagas") ||
    _pmt.includes("luego pago") || _pmt.includes("pago luego") ||
    _pmt.includes("pago cuando") || _pmt.includes("pago al llegar") ||
    _pmt.includes("pago al terminar") || _pmt.includes("pago al final") ||
    _pmt.includes("transfiero") || _pmt.includes("lo transfiero") ||
    _pmt.includes("pago ahi");

  if (!_pmIsPrep && !_pmIsPost) return null;

  const pref = _pmIsPrep ? "prepago" : "postpago";
  const pmMode = (ctx.agentBusinessConfig?.config?.payment_mode) || "both";
  const effectivePref = pmMode === "prepago_only" ? "prepago" : pmMode === "postpago_only" ? "postpago" : pref;
  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "implicit_affirmation_with_payment_preference",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "quote_accepted_booking_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",
      payment_preference: effectivePref,
      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      availability_window: "this_week",
      availability_label: "los proximos dias",
      days_ahead: 7, start_offset_days: 0, max_slots: 3,
      missing_fields: [],
    },
    ruleName: "rule_implicit_affirmation_with_payment",
    priority: 91,
  });
}
function ruleQuoteAcceptedOfferSlots(ctx) {
  const userAccepted = isAffirmativeReply(ctx.text);

  if (!userAccepted) return null;

  const hasCommercialContext =
    !isMissing(ctx.leadState.service_interest) &&
    !isMissingField("vehicle_type", ctx.leadState) &&
    !isMissing(ctx.leadState.district);

  if (!hasCommercialContext) return null;

  const lastBotAction = ctx.leadState.last_bot_action || "";
  const nextGoal = ctx.leadState.next_goal || "";
  const stage = ctx.leadState.stage || "";

  const isAfterQuote =
    stage === "quoted" ||
    nextGoal === "book_appointment" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    lastBotAction === "send_quote_failed";

  if (!isAfterQuote) return null;
  if (!ctx.leadState.payment_preference) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "user_accepted_quote_after_price_message",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "quote_accepted_booking_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      availability_window: "this_week",
      availability_label: "los prximos das",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3,

      missing_fields: [],
    },
    ruleName: "rule_quote_accepted_offer_slots",
    priority: 90,
  });
}
function ruleConfirmBookingFromUserConfirmation(ctx) {
  if (ctx.leadState.stage === "booked" || hasActiveAppointmentContext(ctx)) return null;
  if (/^\s*\d{1,2}\s*$/.test(String(ctx.text || ""))) return null;
  const normalized = normalizeText(ctx.text);

  const confirms =
    normalized === "si" ||
    normalized === "s" ||
    normalized === "ok" ||
    normalized === "dale" ||
    normalized === "confirmo" ||
    normalized === "si confirmo" ||
    normalized.startsWith("si confirmo") ||
    normalized === "confirmado" ||
    normalized === "agenda" ||
    normalized === "agendalo" ||
    normalized === "agndalo" ||
    normalized === "perfecto" ||
    normalized === "listo" ||
    normalized === "excelente" ||
    normalized.includes("si agenda") ||
    normalized.includes("s agenda") ||
    normalized.includes("me acomoda") ||
    normalized.includes("me queda bien") ||
    normalized.includes("esta bien") ||
    normalized.includes("est bien") ||
    normalized.includes("dale agenda") ||
    normalized.includes("dale agendalo") ||
    normalized.includes("confirmar") ||
    normalized.includes("confirmemos") ||
    normalized.includes("si confirmado") ||
    normalized.includes("queda confirmado") ||
    normalized.includes("lo confirmo") ||
    normalized.includes("confirmo la") ||
    normalized.includes("confirmo el") ||
    normalized === "si va" ||
    normalized === "va" ||
    normalized === "va va" ||
    normalized === "si po" ||
    normalized === "sipo" ||
    normalized.startsWith("si va") ||
    normalized.startsWith("ya va") ||
    normalized === "ya" ||
    normalized === "bueno" ||
    normalized === "claro" ||
    normalized === "adelante" ||
    normalized === "hacelo";

  if (!confirms) return null;
  const hasBookingCandidate =
  !isMissing(ctx.leadState.booking_date) &&
  !isMissing(ctx.leadState.booking_time);

const isBookingConfirmationStage =
  ctx.leadState.stage === "booking_confirmation" ||
  ctx.leadState.next_goal === "create_calendar_booking" ||
  ctx.leadState.last_bot_action === "confirm_booking_in_progress";

if (!hasBookingCandidate && !isBookingConfirmationStage) {
  return null;
}

  const missingBookingFields = [];

  if (isMissing(ctx.leadState.service_interest)) {
    missingBookingFields.push("service_interest");
  }

  if (isMissingField("vehicle_type", ctx.leadState)) {
    missingBookingFields.push("vehicle_type");
  }

  if (isMissing(ctx.leadState.district)) {
    missingBookingFields.push("district");
  }

  if (isMissing(ctx.leadState.booking_date)) {
    missingBookingFields.push("booking_date");
  }

  if (isMissing(ctx.leadState.booking_time)) {
    missingBookingFields.push("booking_time");
  }

  if (missingBookingFields.length > 0) {
    const firstMissing = missingBookingFields[0];
  
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "user_confirmed_booking_but_required_booking_data_is_missing",
      message: buildMissingFieldMessage(firstMissing),
      missingFields: missingBookingFields,
      shouldCallLlm: false,
      stateUpdate: {
        missing_fields: missingBookingFields,
        next_goal: buildNextGoal(firstMissing),
        last_bot_action: "ask_missing_data",
      },
      ruleName: "rule_confirm_booking_missing_data",
      priority: 86,
    });
  }

  const slotId =
    ctx.leadState.slot_id ||
    `${ctx.leadState.booking_date}_${ctx.leadState.booking_time}`;
if (!hasServiceAddress(ctx.leadState) || ctx.leadState.address_confirmed !== true) {
  return buildRuleResult({
    resolutionType: "rule_based",
    action: "collect_address",
    reason: "user_confirmed_booking_but_address_is_missing",
    message: "Perfecto. Antes de confirmar la reserva, me puedes enviar la direccion exacta donde seria el servicio?",
    missingFields: ["address"],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "collecting_address",
      intent_last: "booking_confirmed_address_missing",
      next_goal: "collect_address",
      last_bot_action: "collect_address",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      booking_date: ctx.leadState.booking_date,
      booking_time: ctx.leadState.booking_time,
      slot_id: slotId,
      availability_confirmed: ctx.leadState.availability_confirmed ?? false,

      missing_fields: ["address"],
    },
    ruleName: "rule_confirm_booking_collect_address",
    priority: 86,
  });
}
  
  return buildRuleResult({
    resolutionType: "rule_based",
    action: "confirm_booking",
    reason: "user_confirmed_booking_with_complete_context",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_confirmation",
      intent_last: "booking_confirmed_by_user",
      next_goal: "create_calendar_booking",
      last_bot_action: "confirm_booking_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,
      booking_date: ctx.leadState.booking_date,
      booking_time: ctx.leadState.booking_time,
      slot_id: slotId,
      availability_confirmed: true,

      missing_fields: [],
    },
    ruleName: "rule_confirm_booking_from_user_confirmation",
    priority: 86,
  });
}
function ruleQuoteRequest(ctx) {
  const normalized = normalizeText(ctx.text);

  const asksPrice =
    normalized.includes("precio") ||
    normalized.includes("valor") ||
    normalized.includes("cotizacion") ||
    normalized.includes("cotizacion") ||
    normalized.includes("cuanto sale") ||
    normalized.includes("cuanto sale") ||
    normalized.includes("cuanto cuesta") ||
    normalized.includes("cuanto cuesta") ||
    normalized.includes("cuanto vale") ||
    normalized.includes("cuanto vale") ||
    normalized.includes("dame el valor") ||
    normalized.includes("dame precio") ||
    normalized.includes("dame la cotizacion") ||
    normalized.includes("dame la cotizacion") ||
    normalized.includes("quiero cotizar") ||
    normalized.includes("me puedes cotizar");

  if (!asksPrice) return null;

  // Don't re-quote when user is confirming a booking (e.g. "lo reservo, me parece bien el precio")
  if (isAffirmativeReply(ctx.text)) return null;

  // Don't re-quote when user asks for cheaper alternative (Bug 31)
  const _rqAsksCheaper = normalized.includes("mas barato") || normalized.includes("ms barato") ||
    normalized.includes("mas economico") || normalized.includes("mas economica") ||
    normalized.includes("ms economico") || normalized.includes("ms economica") ||
    normalized.includes("mas accesible") || normalized.includes("ms accesible") ||
    normalized.includes("menor precio") || normalized.includes("de menor precio") ||
    normalized.includes("algo mas barato") || normalized.includes("algo economico") ||
    normalized.includes("opcion mas barata") || normalized.includes("opcion economica") ||
    normalized.includes("alternativa") || normalized.includes("no puedo pagar") ||
    normalized.includes("elevado") || normalized.includes("se me va del presupuesto") ||
    normalized.includes("no me da el presupuesto") || normalized.includes("muy caro") ||
    normalized.includes("esta caro");
  if (_rqAsksCheaper) return null;

  const missingFields = [];

  if (isMissing(ctx.leadState.service_interest)) {
    missingFields.push("service_interest");
  }

  if (isMissingField("vehicle_type", ctx.leadState)) {
    missingFields.push("vehicle_type");
  }

  if (isMissing(ctx.leadState.district)) {
    missingFields.push("district");
  }

  if (missingFields.length > 0) {
    const missingService = missingFields.includes("service_interest");
    const missingVehicle = missingFields.includes("vehicle_type");
    const missingDistrict = missingFields.includes("district");

    let firstMissing = missingFields[0];
    let nextGoal = buildNextGoal(firstMissing);
    let message = buildMissingFieldMessage(firstMissing);

    if (missingService && missingVehicle) {
      firstMissing = "vehicle_type";
      nextGoal = "collect_vehicle_type";
      message = "Hola, te ayudo con el valor.\n\nPara enviarte la lista de precios necesito 2 datos:\n- Que vehiculo tienes: " + buildVehicleCategoriesPrompt("auto, SUV o camioneta") + "?\n- En que comuna seria el servicio?\n\nCon eso te mando los valores de " + buildServiceEnumerationText("lavado basico, lavado premium y encerado full") + ". Si alguno te acomoda, despues vemos horarios.";
    } else if (missingVehicle) {
      firstMissing = "vehicle_type";
      nextGoal = "collect_vehicle_type";
      message = "Hola, te ayudo con el valor. Para darte el precio correcto, dime que vehiculo tienes: " + buildVehicleCategoriesPrompt("auto, SUV o camioneta") + "?";
    } else if (missingService) {
      firstMissing = "service_interest";
      nextGoal = "collect_service_interest";
      message = "Hola, te ayudo con el valor. Con los datos de vehiculo y comuna te puedo mandar la lista de precios de " + buildServiceEnumerationText("lavado basico, lavado premium y encerado full") + ".";
    } else if (missingDistrict) {
      firstMissing = "district";
      nextGoal = "collect_district";
      message = "Hola, te ayudo con el valor. En que comuna seria el servicio?";
    }

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "quote_requested_but_required_context_is_missing",
      message,
      missingFields,
      shouldCallLlm: false,
      stateUpdate: {
        stage: ctx.leadState.stage || "qualified",
        intent_last: "quote_requested",
        next_goal: nextGoal,
        last_bot_action: "ask_missing_data",
        missing_fields: missingFields,

        service_interest: ctx.leadState.service_interest || null,
        vehicle_type: ctx.leadState.vehicle_type || null,
        district: ctx.leadState.district || null
      },
      ruleName: "rule_quote_request_missing_context",
      priority: 91,
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "user_requested_quote_with_complete_commercial_context",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "qualified",
      intent_last: "quote_requested",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      missing_fields: [],
    },
    ruleName: "rule_quote_request",
    priority: 91,
  });
}
function ruleScheduleFollowupAfterQuote(ctx) {
  const stage = String(ctx.leadState.stage || "");
  const lastBotAction = String(ctx.leadState.last_bot_action || "");
  const intentLast = String(ctx.leadState.intent_last || "");

  const quoteAlreadySent =
    stage === "quoted" ||
    stage === "booking_selection" ||
    stage === "closing" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    lastBotAction === "offer_available_slots" ||
    lastBotAction === "offer_available_slots_in_progress" ||
    lastBotAction === "offer_booking" ||
    intentLast === "quote_sent" ||
    intentLast === "quote_ready" ||
    !!ctx.memory?.last_quote;

  const hasCommercialContext =
    !isMissing(ctx.leadState.service_interest) &&
    !isMissingField("vehicle_type", ctx.leadState) &&
    !isMissing(ctx.leadState.district);

  const stageSuggestsPostQuote =
    stage === "quoted" ||
    stage === "closing" ||
    stage === "qualified" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    intentLast === "quote_sent" ||
    intentLast === "quote_ready";

  if (!userSaysWillReplyLater(ctx.text)) return null;

  // Si por algn bug no qued marcado como "quoted", igual agendamos followup
  // cuando ya existe contexto comercial completo.
  if (!(quoteAlreadySent || (hasCommercialContext && stageSuggestsPostQuote))) return null;

  const scheduledFor = buildScheduledForIso(24);

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "schedule_followup",
    reason: "client_will_reply_later_after_quote",
    message:
      "Perfecto, ningun problema. Te dejo esto por aca y te escribo manana para ver si te puedo ayudar a agendar. Si prefieres otro dia u horario, dime y lo ajusto.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      intent_last: "followup_scheduled_after_quote",
      next_goal: "await_followup",
      last_bot_action: "schedule_followup",
      followup_type: "post_quote_checkin",
      scheduled_for: scheduledFor,
      missing_fields: []
    },
    ruleName: "rule_schedule_followup_after_quote",
    priority: 86
  });
}
function userDeclinesBookingOrSlots(rawText) {
  const t = normalizeText(rawText);

  return (
    t === "no" ||
    t === "nop" ||
    t === "no gracias" ||
    t === "mejor no" ||
    t === "por ahora no" ||
    t === "ahora no" ||
    t === "ninguno" ||
    t === "ninguna" ||
    t.includes("ninguno me acomoda") ||
    t.includes("ninguna me acomoda") ||
    t.includes("ninguno me sirve") ||
    t.includes("ninguna me sirve") ||
    t.includes("ninguno de esos") ||
    t.includes("ninguna de esas") ||
    t.includes("ninguno funciona") ||
    t.includes("ninguna funciona") ||
    t.includes("mejor no") ||
    t.includes("no gracias") ||
    t.includes("por ahora no") ||
    t.includes("no quiero agendar") ||
    t.includes("no voy a agendar") ||
    t.includes("no agendar") ||
    t.includes("lo dejo para despues") ||
    t.includes("lo dejo para despus") ||
    t.includes("despues veo") ||
    t.includes("despus veo") ||
    t.includes("despues te aviso") ||
    t.includes("despus te aviso")
  );
}

function ruleDeclineOfferedSlots(ctx) {
  const isWaitingSlotSelection =
    ctx.leadState.stage === "booking_selection" ||
    ctx.leadState.stage === "reschedule" ||
    ctx.leadState.next_goal === "collect_selected_slot" ||
    ctx.leadState.last_bot_action === "offer_available_slots" ||
    ctx.leadState.last_bot_action === "offer_available_slots_in_progress" ||
    ctx.leadState.last_bot_action === "offer_reschedule_slots";

  if (!isWaitingSlotSelection) return null;
  if (!userDeclinesBookingOrSlots(ctx.text)) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_objection",
    reason: "user_declined_offered_slots",
    message: "Perfecto, ningun problema. Dejo la cotizacion pendiente. Si mas adelante quieres agendar, escribeme y te mando horarios actualizados.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "closing",
      intent_last: "booking_declined_after_slots",
      next_goal: "wait_customer_decision",
      last_bot_action: "answer_objection",
      booking_options: [],
      missing_fields: []
    },
    ruleName: "rule_decline_offered_slots",
    priority: 91
  });
}

function mentionsAnotherVehicle(rawText) {
  const t = normalizeText(rawText);
  return getClassificationAnotherItemSignals().some((signal) => t.includes(signal));
}

function ruleAvailabilityRequest(ctx) {
  const normalized = normalizeText(ctx.text);

  const asksServiceMenu =
  normalized.includes("que servicios") ||
  normalized.includes("cuales servicios") ||
  normalized.includes("servicios tienen") ||
  normalized.includes("servicios disponibles") ||
  normalized.includes("que lavados") ||
  normalized.includes("lavados tienen") ||
  normalized.includes("que opcines") ||
  normalized.includes("opcines tienen") ||
  normalized.includes("que ofrecen") ||
  normalized.includes("menu de servicios") ||
  normalized.includes("lista de servicios");

if (asksServiceMenu) return null;

  const asksAvailability =
    normalized.includes("horario") ||
    normalized.includes("horarios") ||
    normalized.includes("hora disponible") ||
    normalized.includes("horas disponibles") ||
    normalized.includes("disponible") ||
    normalized.includes("disponibilidad") ||
    normalized.includes("fecha") ||
    normalized.includes("fechas") ||
    normalized.includes("agenda") ||
    normalized.includes("agendar") ||
    normalized.includes("prxima semana") ||
    normalized.includes("siguiente semana") ||
    normalized.includes("otra semana") ||
    normalized.includes("la otra semana") ||
    normalized.includes("ms horarios") ||
    normalized.includes("otros horarios") ||
    normalized.includes("otros das") ||
    normalized.includes("ms adelante") ||
    normalized.includes("este mes");

  if (!asksAvailability) return null;

  const missingFields = [];

  if (isMissing(ctx.leadState.service_interest)) {
    missingFields.push("service_interest");
  }

  const requestsAnotherVehicle = mentionsAnotherVehicle(ctx.text);

  if (requestsAnotherVehicle || isMissingField("vehicle_type", ctx.leadState)) {
    missingFields.push("vehicle_type");
  }

  if (isMissing(ctx.leadState.district)) {
    missingFields.push("district");
  }

  if (missingFields.length > 0) {
    const firstMissing = missingFields[0];

    // Si el cliente pide agendar para "otro auto"/"2 autos", el vehicle_type
    // guardado del turno anterior no sirve para esta reserva nueva -- hay que
    // limpiarlo de verdad (no solo preguntar) para que no quede pegado si el
    // cliente tarda en responder o alguna otra regla lo vuelve a leer.
    const clearVehicleFields = requestsAnotherVehicle
      ? { vehicle_type: null, confirmed_vehicle_type: null, mentioned_vehicle_type: null, fields_to_clear: ["vehicle_type", "confirmed_vehicle_type", "mentioned_vehicle_type"] }
      : {};

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: requestsAnotherVehicle ? "availability_requested_for_another_vehicle" : "availability_requested_but_required_context_is_missing",
      message: buildMissingFieldMessage(firstMissing),
      missingFields,
      shouldCallLlm: false,
      stateUpdate: {
        missing_fields: missingFields,
        next_goal: buildNextGoal(firstMissing),
        last_bot_action: "ask_missing_data",
        intent_last: "availability_requested",
        ...clearVehicleFields,
      },
      ruleName: "rule_availability_request_missing_context",
      priority: 88,
    });
  }

  // Si el modo de pago requiere preguntar primero, lo resolvemos aca mismo en vez
  // de "diferir" a ruleAskPaymentPreference -- esa regla solo dispara cuando
  // isAfterQuote es verdadero (justo despues de un send_quote formal), pero este
  // flujo (pedir agendar con contexto comercial completo, sin cotizacion previa)
  // nunca cumple esa condicion, y antes caia al LLM sin resolver nada (BUG1, 2026-07-17).
  const _pmAvail = (ctx.agentBusinessConfig?.config?.payment_mode) || "both";
  if (_pmAvail === "both" && !ctx.leadState.payment_preference) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_payment_preference",
      reason: "availability_requested_payment_preference_unknown",
      message: "",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "quoted",
        intent_last: "payment_preference_asked",
        next_goal: "collect_payment_preference",
        last_bot_action: "ask_payment_preference",
        service_interest: ctx.leadState.service_interest,
        vehicle_type: ctx.leadState.vehicle_type,
        district: ctx.leadState.district,
        missing_fields: [],
      },
      ruleName: "rule_ask_payment_preference",
      priority: 91,
    });
  }

  function getAvailabilityConfig(text) {
    if (
      text.includes("prxima semana") ||
      text.includes("siguiente semana") ||
      text.includes("otra semana") ||
      text.includes("la otra semana")
    ) {
      return {
        availability_window: "next_week",
        availability_label: "la prxima semana",
        days_ahead: 7,
        start_offset_days: 7,
        max_slots: 5
      };
    }

    if (
      text.includes("ms adelante") ||
      text.includes("ms horarios") ||
      text.includes("otros horarios") ||
      text.includes("otros das")
    ) {
      return {
        availability_window: "next_14_days",
        availability_label: "las prxims dos semanas",
        days_ahead: 14,
        start_offset_days: 0,
        max_slots: 6
      };
    }

    if (
      text.includes("este mes") ||
      text.includes("durante el mes")
    ) {
      return {
        availability_window: "next_30_days",
        availability_label: "las prxims semanas",
        days_ahead: 30,
        start_offset_days: 0,
        max_slots: 8
      };
    }

    return {
      availability_window: "this_week",
      availability_label: "los prximos das",
      days_ahead: 7,
      start_offset_days: 0,
      max_slots: 3
    };
  }

  const config = getAvailabilityConfig(normalized);

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "offer_available_slots",
    reason: "user_requested_available_slots",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_selection",
      intent_last: "availability_requested",
      next_goal: "send_available_slots",
      last_bot_action: "offer_available_slots_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      availability_window: config.availability_window,
      availability_label: config.availability_label,
      days_ahead: config.days_ahead,
      start_offset_days: config.start_offset_days,
      max_slots: config.max_slots,

      missing_fields: [],
    },
    ruleName: "rule_availability_request",
    priority: 88,
  });
}
function ruleSelectOfferedSlot(ctx) {
  const t = normalizeText(ctx.text);
  const bookingOptions = Array.isArray(ctx.leadState.booking_options)
    ? ctx.leadState.booking_options
    : [];

  const isWaitingSlotSelection =
    ctx.leadState.stage === "booking_selection" ||
    ctx.leadState.stage === "reschedule" ||
    ctx.leadState.next_goal === "collect_selected_slot" ||
    ctx.leadState.last_bot_action === "offer_available_slots" ||
    ctx.leadState.last_bot_action === "offer_reschedule_slots";

  if (!isWaitingSlotSelection || bookingOptions.length === 0) return null;

  function localPartsForSlot(slot) {
    const rawStart =
      slot.slot_start_at ||
      slot.start_at ||
      slot.start ||
      slot.datetime ||
      null;

    if (!rawStart) {
      return {
        date: slot.booking_date || slot.date || null,
        time: slot.booking_time || slot.time || null,
        weekday: null,
        dayMonthSlash: null,
        dayMonthDash: null,
        label: normalizeText(slot.label || "")
      };
    }

    const date = new Date(rawStart);
    if (Number.isNaN(date.getTime())) {
      return {
        date: slot.booking_date || slot.date || null,
        time: slot.booking_time || slot.time || null,
        weekday: null,
        dayMonthSlash: null,
        dayMonthDash: null,
        label: normalizeText(slot.label || "")
      };
    }

    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    const timeParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Santiago",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    const weekday = normalizeText(new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      weekday: "long"
    }).format(date));

    return {
      date: dateParts.year + "-" + dateParts.month + "-" + dateParts.day,
      time: timeParts.hour + ":" + timeParts.minute,
      weekday,
      dayMonthSlash: dateParts.day + "/" + dateParts.month,
      dayMonthDash: dateParts.day + "-" + dateParts.month,
      label: normalizeText(slot.label || "")
    };
  }

  function findSlotSelection() {
    const selectedNumber = /^\d+$/.test(t) ? Number(t) : null;

    if (selectedNumber !== null) {
      return {
        selectedNumber,
        selectedIndex: selectedNumber - 1,
        selected: bookingOptions[selectedNumber - 1] || null,
        numeric: true,
        ambiguous: false
      };
    }

    
    function extractOrdinalSelection(rawText) {
      const ordinalWords = {
        primera: 1, primero: 1, primer: 1,
        segunda: 2, segundo: 2,
        tercera: 3, tercero: 3, tercer: 3,
        cuarta: 4, cuarto: 4,
        quinta: 5, quinto: 5,
        ultima: -1, ultimo: -1
      };

      const tokens = rawText.split(" ").map(function (tok) {
        return tok.replace(".", "").replace(",", "");
      });

      for (const tok of tokens) {
        if (Object.prototype.hasOwnProperty.call(ordinalWords, tok)) {
          return ordinalWords[tok];
        }
      }

      const selectorWords = ["la", "el", "opcion", "numero", "n"];
      for (let i = 0; i < tokens.length - 1; i++) {
        if (selectorWords.indexOf(tokens[i]) !== -1) {
          const next = tokens[i + 1];
          const asNumber = Number(next);
          if (next.length > 0 && next.length <= 2 && Number.isInteger(asNumber) && String(asNumber) === next) {
            return asNumber;
          }
        }
      }

      return null;
    }

    const ordinal = extractOrdinalSelection(t);
    if (ordinal !== null) {
      const ordinalIndex = ordinal === -1 ? bookingOptions.length - 1 : ordinal - 1;
      return {
        selectedNumber: ordinalIndex + 1,
        selectedIndex: ordinalIndex,
        selected: bookingOptions[ordinalIndex] || null,
        numeric: true,
        ambiguous: false
      };
    }


    const looksLikeScheduleQuestion = [
      "atienden",
      "trabajan",
      "tienen horario",
      "hay servicio",
      "hay horario",
      "hay clases",
      "abren"
    ].some(function(kw) { return t.includes(kw); });

    if (looksLikeScheduleQuestion) {
      return { selectedNumber: null, selectedIndex: null, selected: null, numeric: false, ambiguous: false };
    }
    const matches = bookingOptions
      .map((slot, index) => ({ slot, index, parts: localPartsForSlot(slot) }))
      .filter(({ parts }) => {
        const dateNoLeadingZeroSlash = parts.dayMonthSlash
          ? parts.dayMonthSlash.replace(/^0/, "").replace("/0", "/")
          : null;
        const dateNoLeadingZeroDash = parts.dayMonthDash
          ? parts.dayMonthDash.replace(/^0/, "").replace("-0", "-")
          : null;

        return (
          (parts.weekday && t === parts.weekday) ||
          (parts.weekday && t.includes(parts.weekday)) ||
          (parts.dayMonthSlash && t.includes(parts.dayMonthSlash)) ||
          (parts.dayMonthDash && t.includes(parts.dayMonthDash)) ||
          (dateNoLeadingZeroSlash && t.includes(dateNoLeadingZeroSlash)) ||
          (dateNoLeadingZeroDash && t.includes(dateNoLeadingZeroDash)) ||
          (parts.date && t.includes(parts.date)) ||
          (parts.label && parts.label.includes(t) && t.length >= 3)
        );
      });

    if (matches.length > 1) {
      const requestedTime = extractBookingTimeFromText(t);

      if (requestedTime) {
        const timeNarrowed = matches.filter(
          ({ parts }) => parts.time === requestedTime
        );

        if (timeNarrowed.length === 1) {
          const narrowedMatch = timeNarrowed[0];
          return {
            selectedNumber: narrowedMatch.index + 1,
            selectedIndex: narrowedMatch.index,
            selected: narrowedMatch.slot,
            numeric: false,
            ambiguous: false
          };
        }
      }
    }

    if (matches.length === 1) {
      const match = matches[0];
      const requestedTimeForSingleMatch = extractBookingTimeFromText(t);
      const singleMatchTimeMismatch =
        requestedTimeForSingleMatch &&
        match.parts.time &&
        match.parts.time !== requestedTimeForSingleMatch;

      if (!singleMatchTimeMismatch) {
        return {
          selectedNumber: match.index + 1,
          selectedIndex: match.index,
          selected: match.slot,
          numeric: false,
          ambiguous: false
        };
      }

      return {
        selectedNumber: null,
        selectedIndex: null,
        selected: null,
        numeric: false,
        ambiguous: false,
        dayMatchTimeMismatch: true,
        availableTimeForDay: match.parts.time
      };
    }

    if (matches.length > 1) {
      return {
        selectedNumber: null,
        selectedIndex: null,
        selected: null,
        numeric: false,
        ambiguous: true
      };
    }

    return {
      selectedNumber: null,
      selectedIndex: null,
      selected: null,
      numeric: false,
      ambiguous: false
    };
  }

  const selection = findSlotSelection();

  if (selection.ambiguous) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "ambiguous_booking_day_selected",
      message: "Tengo mas de una opcion para ese dia. Para evitar errores, responde con el numero exacto de la opcion que prefieres.",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        last_bot_action: "answer_question",
        next_goal: "collect_selected_slot"
      },
      ruleName: "rule_ambiguous_booking_day_selected",
      priority: 90
    });
  }

  if (!selection.selected) {
    if (selection.dayMatchTimeMismatch) {
      return buildRuleResult({
        resolutionType: "rule_based",
        action: "answer_question",
        reason: "booking_day_matches_but_time_does_not",
        message: `Ese dia tengo disponible a las ${selection.availableTimeForDay}, no a la hora que mencionas. Te acomoda esa hora, o prefieres otra de las opciones que te envie?`,
        missingFields: [],
        shouldCallLlm: false,
        stateUpdate: {
          last_bot_action: "answer_question",
          next_goal: "collect_selected_slot"
        },
        ruleName: "rule_booking_day_matches_but_time_does_not",
        priority: 90
      });
    }

    if (!selection.numeric) return null;

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "invalid_booking_option_selected",
      message: "Esa opcion no esta disponible. Por favor responde con una de las opciones que te envie.",
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        last_bot_action: "answer_question",
        next_goal: "collect_selected_slot"
      },
      ruleName: "rule_invalid_booking_option_selected",
      priority: 90
    });
  }

  const selectedNumber = selection.selectedNumber;
  const selected = selection.selected;
  const slotStartAt = selected.slot_start_at || selected.start_at || selected.start || null;
  const slotEndAt = selected.slot_end_at || selected.end_at || selected.end || null;
  const slotId = selected.slot_id || selected.id || null;
  const localParts = localPartsForSlot(selected);
  const bookingDate = selected.booking_date || selected.date || localParts.date;
  const bookingTime = selected.booking_time || selected.time || localParts.time;

  const isRescheduleFlow =
    ctx.leadState.stage === "reschedule" ||
    ctx.leadState.intent_last === "reschedule_requested" ||
    ctx.leadState.intent_last === "reschedule_booking_requested" ||
    ctx.leadState.last_bot_action === "offer_reschedule_slots";

  if (isRescheduleFlow) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "reschedule_booking",
      reason: "user_selected_reschedule_slot_option_" + selectedNumber,
      message: null,
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "reschedule",
        intent_last: "reschedule_slot_selected",
        next_goal: "reschedule_active_booking",
        last_bot_action: "reschedule_booking_in_progress",
        booking_date: bookingDate,
        booking_time: bookingTime,
        slot_id: slotId,
        selected_slot: selected,
        selected_booking_option: selectedNumber,
        slot_start_at: slotStartAt,
        slot_end_at: slotEndAt,
        availability_confirmed: true,
        missing_fields: []
      },
      ruleName: "rule_select_reschedule_slot",
      priority: 90
    });
  }

  const needsAddress = !hasServiceAddress(ctx.leadState) || ctx.leadState.address_confirmed === false;

  if (needsAddress) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "collect_address",
      reason: selection.numeric ? "user_selected_slot_missing_address" : "user_selected_slot_by_day_or_date_missing_address",
      message: "Perfecto. Para dejar la reserva bien registrada, me puedes enviar la direccion exacta donde seria el servicio?",
      missingFields: ["address"],
      shouldCallLlm: false,
      stateUpdate: {
        stage: "collecting_address",
        intent_last: "slot_selected_missing_address",
        next_goal: "collect_address",
        last_bot_action: "collect_address",
        booking_date: bookingDate,
        booking_time: bookingTime,
        slot_id: slotId,
        selected_slot: selected,
        selected_booking_option: selectedNumber,
        slot_start_at: slotStartAt,
        slot_end_at: slotEndAt,
        availability_confirmed: true,
        missing_fields: ["address"]
      },
      ruleName: "rule_select_slot_collect_address",
      priority: 90
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "confirm_booking",
    reason: selection.numeric ? "user_selected_slot_with_address" : "user_selected_slot_by_day_or_date_with_address",
    message: null,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "booking_confirmation",
      intent_last: "slot_selected_by_user",
      next_goal: "create_calendar_booking",
      last_bot_action: "confirm_booking_in_progress",
      booking_date: bookingDate,
      booking_time: bookingTime,
      slot_id: slotId,
      selected_slot: selected,
      selected_booking_option: selectedNumber,
      slot_start_at: slotStartAt,
      slot_end_at: slotEndAt,
      availability_confirmed: true,
      missing_fields: []
    },
    ruleName: "rule_select_slot_confirm_booking",
    priority: 90
  });
}

function userAsksPrice(rawText) {
  const normalized = normalizeText(rawText);

  return (
    normalized.includes("precio") ||
    normalized.includes("valor") ||
    normalized.includes("cuanto sale") ||
    normalized.includes("cuanto salen") ||
    normalized.includes("cuantos salen") ||
    normalized.includes("cuanto cuesta") ||
    normalized.includes("cuanto cuestan") ||
    normalized.includes("cuanto vale") ||
    normalized.includes("cuanto valen") ||
    normalized.includes("cotiza") ||
    normalized.includes("cotizacion") ||
    normalized.includes("dame el valor") ||
    normalized.includes("me das el valor")
  );
}

function userAsksServiceRecommendation(rawText) {
  const normalized = normalizeText(rawText);

  return (
    normalized.includes("que me recomiendas") ||
    normalized.includes("qu me recomiendas") ||
    normalized.includes("que recomiendas") ||
    normalized.includes("qu recomiendas") ||
    normalized.includes("cual me recomiendas") ||
    normalized.includes("cul me recomiendas") ||
    normalized.includes("cual me conviene") ||
    normalized.includes("cul me conviene") ||
    normalized.includes("no se cual elegir") ||
    normalized.includes("no s cul elegir") ||
    normalized.includes("ayudame a elegir") ||
    normalized.includes("aydame a elegir")
  );
}

function userAsksServiceMenu(rawText) {
  const normalized = normalizeText(rawText);

  const asksAvailabilityOnly =
    normalized.includes("horario") ||
    normalized.includes("horarios") ||
    normalized.includes("agenda") ||
    normalized.includes("agendar") ||
    normalized.includes("hora disponible") ||
    normalized.includes("horas disponibles");

  return (
    normalized.includes("que servicios") ||
    normalized.includes("que servicio") ||
    normalized.includes("cuales servicios") ||
    normalized.includes("cual servicio") ||
    normalized.includes("cuales tiene") ||
    normalized.includes("cual tiene") ||
    normalized.includes("cuales tienes") ||
    normalized.includes("cual tienes") ||
    normalized.includes("que tiene") ||
    normalized.includes("que tienes") ||
    normalized.includes("servicios disponibles") ||
    normalized.includes("que ofrecen") ||
    normalized.includes("menu de servicios") ||
    normalized.includes("lista de servicios") ||
    normalized.includes("opciones tienen") ||
    normalized.includes("que opciones") ||
    normalized.includes("que hay") ||
    (!asksAvailabilityOnly && normalized.includes("que esta disponible")) ||
    (!asksAvailabilityOnly && normalized.includes("que tienes disponible"))
  );
}

function userAsksServiceDetails(rawText) {
  const normalized = normalizeText(rawText);

  return (
    normalized.includes("que trae") ||
    normalized.includes("qu trae") ||
    normalized.includes("que incluye") ||
    normalized.includes("qu incluye") ||
    normalized.includes("incluye") ||
    normalized.includes("exactamente")
  );
}

function userAsksAvailability(rawText) {
  const normalized = normalizeText(rawText);

  return (
    normalized.includes("horario") ||
    normalized.includes("horarios") ||
    normalized.includes("disponible") ||
    normalized.includes("disponibilidad") ||
    normalized.includes("fecha") ||
    normalized.includes("agenda") ||
    normalized.includes("agendar") ||
    normalized.includes("prxima semana") ||
    normalized.includes("prxima semana") ||
    normalized.includes("siguiente semana") ||
    normalized.includes("ms horarios") ||
    normalized.includes("ms horarios") ||
    normalized.includes("otros das") ||
    normalized.includes("otros das")
  );
}

function ruleReQuoteOnChangedCommercialFieldBeforeBooking(ctx) {
  if (hasActiveAppointmentContext(ctx)) return null;

  const stage = ctx.leadState.stage || "new_lead";
  const excludedStages = [
    "collecting_address",
    "address_confirmation",
    "booking_selection",
    "booking_confirmation",
    "booked",
    "cancelling",
    "reschedule",
    "post_service",
    "human_handoff"
  ];
  if (excludedStages.indexOf(stage) !== -1) return null;

  const hadServiceBefore = !isMissing(ctx.leadState.service_interest);
  const hadVehicleBefore = !isMissingField("vehicle_type", ctx.leadState);
  const hadDistrictBefore = !isMissing(ctx.leadState.district);

  if (!hadServiceBefore && !hadVehicleBefore && !hadDistrictBefore) return null;

  const mentionedService = extractServiceInterestFromText(ctx.text);
  const mentionedDistrict = normalizeDistrictValue(extractDistrictFromText(ctx.text));
  const vehicleDetection = classifyVehicleFromText(ctx.text, ctx.leadState);

  const serviceChanged = !!mentionedService && mentionedService !== ctx.leadState.service_interest;
  const districtChanged = !!mentionedDistrict && mentionedDistrict !== ctx.leadState.district;
  const vehicleChanged =
    !!vehicleDetection.confirmed_vehicle_type &&
    vehicleDetection.confirmed_vehicle_type !== ctx.leadState.vehicle_type;
  const vehicleAmbiguous =
    !!vehicleDetection.mentioned_vehicle_type &&
    !vehicleDetection.confirmed_vehicle_type &&
    vehicleDetection.mentioned_vehicle_type !== ctx.leadState.vehicle_type;

  if (!serviceChanged && !districtChanged && !vehicleChanged && !vehicleAmbiguous) {
    return null;
  }

  if (vehicleAmbiguous && !vehicleChanged) {
    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "vehicle_change_needs_confirmation",
      message: "Gracias por avisar. Para cotizar bien, me confirmas cual de estas categorias es la correcta: " + buildVehicleCategoriesPrompt("estandar o SUV/4x4") + "?",
      missingFields: ["vehicle_type"],
      shouldCallLlm: false,
      stateUpdate: {
        next_goal: "collect_vehicle_type",
        last_bot_action: "ask_missing_data",
        missing_fields: ["vehicle_type"]
      },
      ruleName: "rule_vehicle_change_needs_confirmation",
      priority: 89
    });
  }

  const newService = serviceChanged ? mentionedService : ctx.leadState.service_interest;
  const newDistrict = districtChanged ? mentionedDistrict : ctx.leadState.district;
  const newVehicle = vehicleChanged ? vehicleDetection.confirmed_vehicle_type : ctx.leadState.vehicle_type;

  const stillMissing = [];
  if (isMissing(newService)) stillMissing.push("service_interest");
  if (isMissingField("vehicle_type", { vehicle_type: newVehicle })) stillMissing.push("vehicle_type");
  if (isMissing(newDistrict)) stillMissing.push("district");

  if (stillMissing.length > 0) {
    const firstMissing = stillMissing[0];

    return buildRuleResult({
      resolutionType: "rule_based",
      action: "ask_missing_data",
      reason: "commercial_field_changed_missing_other_data",
      message: buildMissingFieldMessage(firstMissing),
      missingFields: stillMissing,
      shouldCallLlm: false,
      stateUpdate: {
        service_interest: newService,
        vehicle_type: newVehicle,
        district: newDistrict,
        missing_fields: stillMissing,
        next_goal: buildNextGoal(firstMissing),
        last_bot_action: "ask_missing_data"
      },
      ruleName: "rule_commercial_field_changed_missing_other_data",
      priority: 89
    });
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "commercial_field_changed_requote",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "qualified",
      intent_last: "quote_ready",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",
      service_interest: newService,
      vehicle_type: newVehicle,
      district: newDistrict,
      missing_fields: []
    },
    ruleName: "rule_commercial_field_changed_requote",
    priority: 89
  });
}
function ruleSendQuoteWhenCommercialContextComplete(ctx) {
  const hasService = !isMissing(ctx.leadState.service_interest);
  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  if (!hasService || !hasVehicle || !hasDistrict) return null;

  const stage = ctx.leadState.stage || "new_lead";
  const lastBotAction = ctx.leadState.last_bot_action || "";
  const nextGoal = ctx.leadState.next_goal || "";

  const isBookingFlow = [
    "booking_selection",
    "booking_confirmation",
    "collecting_address",
    "address_confirmation",
    "booked",
    "cancelling",
    "reschedule",
    "post_service",
    "human_handoff"
  ].includes(stage);

  if (isBookingFlow) return null;

  if (userAsksAvailability(ctx.text)) return null;
  if (userAsksServiceMenu(ctx.text)) return null;
  if (userAsksServiceDetails(ctx.text)) return null;
  if (userAsksServiceRecommendation(ctx.text)) return null;

  const quoteAlreadySent =
    stage === "quoted" ||
    lastBotAction === "send_quote" ||
    lastBotAction === "send_quote_in_progress" ||
    !!ctx.memory?.last_quote;

  const completedByCurrentMessage =
    !!detectedStateUpdate.service_interest ||
    !!detectedStateUpdate.vehicle_type ||
    !!detectedStateUpdate.district;

  const wasCollectingCommercialData =
    lastBotAction === "ask_missing_data" ||
    nextGoal === "collect_service_interest" ||
    nextGoal === "collect_vehicle_type" ||
    nextGoal === "collect_district" ||
    nextGoal === "collect_vehicle_and_district";

  const _sqNorm = normalizeText(ctx.text);
  const _sqIsDiscountQ = _sqNorm.includes("descuento") || _sqNorm.includes("precio especial") || _sqNorm.includes("promocion") || _sqNorm.includes("rebaja") || _sqNorm.includes("promo");
  const _sqIsBookingSignal = isAffirmativeReply(ctx.text) || _sqNorm.includes("lo reservo") || _sqNorm.includes("quiero reservar") || _sqNorm.includes("voy a reservar") || _sqNorm.includes("vamos a reservar") || _sqNorm.includes("lo agendo") || _sqNorm.includes("agendemos") || _sqNorm.includes("quisiera reservar");
  const _sqAsksCheaper = _sqNorm.includes("mas barato") || _sqNorm.includes("ms barato") ||
    _sqNorm.includes("mas economico") || _sqNorm.includes("mas economica") ||
    _sqNorm.includes("ms economico") || _sqNorm.includes("ms economica") ||
    _sqNorm.includes("mas accesible") || _sqNorm.includes("ms accesible") ||
    _sqNorm.includes("menor precio") || _sqNorm.includes("de menor precio") ||
    _sqNorm.includes("algo mas barato") || _sqNorm.includes("algo economico") ||
    _sqNorm.includes("opcion mas barata") || _sqNorm.includes("opcion economica") ||
    _sqNorm.includes("alternativa") || _sqNorm.includes("no puedo pagar") ||
    _sqNorm.includes("elevado") || _sqNorm.includes("se me va del presupuesto") ||
    _sqNorm.includes("no me da el presupuesto") || _sqNorm.includes("muy caro") ||
    _sqNorm.includes("esta caro");
  if (_sqAsksCheaper) return null;
  const explicitlyAsksPrice = userAsksPrice(ctx.text) && !_sqIsDiscountQ && !_sqIsBookingSignal && !_sqAsksCheaper;

  if (quoteAlreadySent && !explicitlyAsksPrice) return null;

  if (!completedByCurrentMessage && !wasCollectingCommercialData && !explicitlyAsksPrice) {
    return null;
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "commercial_context_complete_send_quote",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "qualified",
      intent_last: "quote_ready",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",

      service_interest: ctx.leadState.service_interest,
      vehicle_type: ctx.leadState.vehicle_type,
      district: ctx.leadState.district,

      missing_fields: []
    },
    ruleName: "rule_send_quote_when_commercial_context_complete",
    priority: 84
  });
}
   
function ruleCheaperAlternativeRequest(ctx) {
  const t = normalizeText(ctx.text);
  const asksForCheaper =
    t.includes("mas economico") ||
    t.includes("mas economica") ||
    t.includes("mas barato") ||
    t.includes("algo mas") ||
    t.includes("algo economico") ||
    t.includes("algo economica") ||
    t.includes("no me alcanza") ||
    t.includes("no tengo presupuesto") ||
    t.includes("presupuesto ajustado") ||
    t.includes("mas accesible") ||
    t.includes("menor precio") ||
    t.includes("de menor precio") ||
    t.includes("opcion mas barata") ||
    t.includes("opcion economica") ||
    t.includes("opcion economica") ||
    t.includes("alternativa") ||
    t.includes("alternativa mas barata") ||
    t.includes("alternativa economica") ||
    t.includes("alternativa mas economica") ||
    t.includes("muy caro") ||
    t.includes("esta caro") ||
    t.includes("sale caro") ||
    t.includes("no tengo para") ||
    t.includes("se me va del presupuesto") ||
    t.includes("fuera de mi presupuesto") ||
    t.includes("no puedo pagar") ||
    t.includes("no me da el presupuesto");
  if (!asksForCheaper) return null;
  // Don't suggest cheaper when user accepts despite mentioning price (e.g. "esta caro pero perfecto, lo agendo")
  if (isAffirmativeReply(ctx.text)) return null;
  const currentService = ctx.leadState.service_interest || "";
  if (currentService === "lavado_basico") return null;
  const vehicle = ctx.leadState.vehicle_type || "";
  const district = ctx.leadState.district || "";
  if (!vehicle || !district) return null;
  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "user_asks_for_cheaper_alternative",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      service_interest: "lavado_basico",
      intent_last: "price_inquiry_cheaper_alternative",
      next_goal: "offer_booking",
      last_bot_action: "send_quote_in_progress",
      missing_fields: []
    },
    ruleName: "rule_cheaper_alternative_request",
    priority: 87
  });
}

function ruleObjectionWillThink(ctx) {
  const t = normalizeText(ctx.text);

  const looksLikeWillThink =
    t.includes("lo voy a pensar") ||
    t.includes("lo pensare") ||
    t.includes("lo pensar") ||
    t.includes("lo veo") ||
    t.includes("despus te aviso") ||
    t.includes("te aviso") ||
    t.includes("despus") ||
    t.includes("ms adelante") ||
    t.includes("ms adelante");

  if (!looksLikeWillThink) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_objection",
    reason: "client_will_think",
    message:
      "Perfecto, tomate tu tiempo. Cualquier cosa me escribes y te puedo ayudar con dudas, precios u horarios. Si quieres, puedo enviarte horarios disponibles o agendar cuando te acomode. Qu prefieres?",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "closing",
      intent_last: "will_think",
      next_goal: "book_appointment",
      last_bot_action: "answer_objection",
      missing_fields: []
    },
    ruleName: "rule_objection_will_think",
    priority: 83
  });
}

function userSignalsVeryDirty(rawText) {
  const t = normalizeText(rawText);

  if (!t) return false;

  // Keep this ASCII-only to avoid encoding issues in exports.
  const strongSignals = [
    "muy sucio",
    "muy sucia",
    "muy sucios",
    "muy sucias",
    "bastante sucio",
    "bastante sucia",
    "sucio",
    "sucia",
    "sucios",
    "sucias",
    "viejo y sucio",
    "vieja y sucia",
    "por dentro y por fuera",
    "sucio por dentro y por fuera",
    "muy sucio por dentro y por fuera",
    "lavado profundo",
    "limpieza profunda",
    "limpieza completa",
    "interior full",
    "detallado",
    "detallada",
    "detailing"
  ];

  return containsAny(t, strongSignals);
}

function ruleRecommendPremiumWhenVeryDirty(ctx) {
  const rawText = ctx.text || "";

  // Only apply when service is missing, and the user text strongly implies a deep clean.
  if (!isMissing(ctx.leadState.service_interest)) return null;
  if (!userSignalsVeryDirty(rawText)) return null;

  const updatedLeadState = {
    ...ctx.leadState,
    service_interest: "lavado_premium",
  };

  const requiredFields = getRequiredFields(updatedLeadState.stage);
  const missingFields = requiredFields.filter((field) => isMissingField(field, updatedLeadState));

  // Ask for exactly 1 missing field (district or vehicle_type) and keep the rest in missing_fields.
  const firstMissing = missingFields[0] || "district";

  const askMessageByField = {
    district:
      "Perfecto. Si tu auto esta muy sucio por dentro y por fuera, te recomiendo el lavado premium (limpieza profunda). Para cotizar, en que comuna estas?",
    vehicle_type:
      "Perfecto. Si tu auto esta muy sucio por dentro y por fuera, te recomiendo el lavado premium. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon.",
    service_interest:
      "Perfecto. Te recomiendo el lavado premium (limpieza profunda). Para cotizar, en que comuna estas?",
  };

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "recommend_premium_when_very_dirty",
    message: askMessageByField[firstMissing] || askMessageByField.district,
    missingFields,
    shouldCallLlm: false,
    stateUpdate: {
      service_interest: "lavado_premium",
      missing_fields: missingFields,
      next_goal: buildNextGoal(firstMissing),
      last_bot_action: "ask_missing_data",
    },
    ruleName: "rule_recommend_premium_when_very_dirty",
    priority: 81,
  });
}
function ruleVehicleRuralNeedsClarification(ctx) {
  if (!isMissingField("vehicle_type", ctx.leadState)) return null;

  const normalized = normalizeText(ctx.text);
  if (normalized.indexOf("rural") === -1) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "vehicle_rural_needs_clarification",
    message: "Para cotizar bien tu auto rural, es de tamano normal (como un sedan) o es mas grande, tipo familiar o con 7 asientos?",
    missingFields: ["vehicle_type"],
    shouldCallLlm: false,
    stateUpdate: {
      intent_last: "vehicle_rural_clarification_pending",
      next_goal: "collect_vehicle_type",
      last_bot_action: "ask_missing_data",
      missing_fields: ["vehicle_type"]
    },
    ruleName: "rule_vehicle_rural_needs_clarification",
    priority: 86
  });
}
function ruleAdditionalServiceRequestWhileBooked(ctx) {
  if (ctx.leadState.stage !== "booked" && !hasActiveAppointmentContext(ctx)) return null;
  if (ctx.leadState.human_handoff === true) return null;

  const t = normalizeText(ctx.text);
  const mentionsAdditional =
    t.includes("tambien") ||
    t.includes("ademas") ||
    t.includes("aparte") ||
    t.includes("otro servicio") ||
    t.includes("otra cita") ||
    t.includes("otra hora") ||
    t.includes("segundo servicio");
  if (!mentionsAdditional) return null;

  const detectedService = extractServiceInterestFromText(ctx.text);
  if (!detectedService) return null;
  if (detectedService === ctx.leadState.service_interest) return null;

  const services = getServicesFromBusinessConfig(ctx);
  const matchedConfig = services.find((s) => s.key === detectedService);
  const serviceName = matchedConfig?.name || String(detectedService).replace(/_/g, " ");

  const _asrDimensionLabel = getClassificationDimensionConfig()?.label || "tipo de vehiculo";
  const _asrDimensionOptions = buildVehicleCategoriesPrompt("sedan, SUV o camioneta");

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "additional_service_requested_while_booked",
    message: "Perfecto, para agendar tambien " + serviceName + ", dime que " + _asrDimensionLabel + " prefieres: " + _asrDimensionOptions + "?",
    missingFields: ["vehicle_type"],
    shouldCallLlm: false,
    stateUpdate: {
      stage: "qualified",
      service_interest: detectedService,
      vehicle_type: null,
      confirmed_vehicle_type: null,
      mentioned_vehicle_type: null,
      fields_to_clear: ["vehicle_type", "confirmed_vehicle_type", "mentioned_vehicle_type"],
      intent_last: "additional_service_request_captured",
      next_goal: "collect_vehicle_type",
      last_bot_action: "ask_missing_data",
      missing_fields: ["vehicle_type"]
    },
    ruleName: "rule_additional_service_request_while_booked",
    priority: 94
  });
}

function ruleAlreadyBookedAcknowledgment(ctx) {
  if (ctx.leadState.stage !== "booked" && !hasActiveAppointmentContext(ctx)) return null;
  if (ctx.leadState.human_handoff === true) return null;

  // No confiar en esto si el cliente esta a mitad de cotizar/ajustar una
  // reserva NUEVA (ej. agendando un segundo vehiculo mientras ya tiene otra
  // reserva activa) -- un "si" ahi confirma la cotizacion/el ajuste en curso,
  // no una reserva que todavia no existe. Mismo chequeo "isAfterQuote" que ya
  // usa ruleShowMeSlotsAfterQuote. Sin esto, esta regla le aseguraba al
  // cliente una reserva confirmada que nunca se llego a crear -- confirmado
  // 2 veces reales por el usuario 2026-07-25: una vez corrigiendo el tipo de
  // vehiculo, otra vez respondiendo "si" a "quieres que te mande los horarios?".
  const isMidNewQuoteFlow =
    ctx.leadState.stage === "quoted" ||
    ctx.leadState.last_bot_action === "send_quote" ||
    ctx.leadState.last_bot_action === "send_quote_in_progress" ||
    ctx.leadState.intent_last === "vehicle_type_correction" ||
    ctx.leadState.intent_last === "quote_ready";
  if (isMidNewQuoteFlow) return null;

  const t = normalizeText(ctx.text);
  const confirmSignals = [
    "confirma", "confirmar", "si", "ok", "dale", "perfecto", "listo", "ya",
    "confirmo", "agendalo", "confirmado", "gracias", "bueno", "muchas gracias"
  ];
  const isConfirmOrAck = confirmSignals.some(function(kw) { return t === kw || t.includes(kw + " "); }) || confirmSignals.some(function(kw) { return t.endsWith(kw); });

  if (!isConfirmOrAck) return null;

  const service = ctx.leadState.service_interest ? String(ctx.leadState.service_interest).replace(/_/g," ") : "tu servicio";

  // Preferir la fecha real de la cita (memory.last_appointment, tabla
  // appointments) sobre lead_state.booking_date/booking_time -- ese campo es
  // de un solo valor y se puede desincronizar (ej. un decision del LLM lo
  // sobreescribe con datos inventados sin relacion a la cita real).
  const realAppointment = ctx.memory?.last_appointment;
  let when = realAppointment?.start_at ? formatAppointmentWhen(realAppointment.start_at) : null;
  if (!when || when === "la fecha coordinada") {
    const date = ctx.leadState.booking_date || "";
    const time = ctx.leadState.booking_time || "";
    when = date && time ? date + " a las " + time : (date || "la fecha coordinada");
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "booking_already_confirmed_acknowledgment",
    message: "Tu reserva ya quedo confirmada para " + when + ". Servicio: " + service + ". Si necesitas cambiar algo, escribeme.",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: { last_bot_action: "answer_question", missing_fields: [] },
    ruleName: "rule_already_booked_acknowledgment",
    priority: 96
  });
}
function ruleAddressCorrectionDuringConfirmation(ctx) {
  const isBookingConfirmationStage =
    ctx.leadState.stage === "booking_confirmation" ||
    ctx.leadState.last_bot_action === "confirm_address" ||
    ctx.leadState.next_goal === "create_calendar_booking";

  if (!isBookingConfirmationStage) return null;
  if (!looksLikeAddress(ctx.text)) return null;
  if (isAffirmativeReply(ctx.text)) return null;

  let newAddress = String(ctx.text || "").trim();
  const correctionPrefixes = [
    "en realidad es ", "en realidad ", "ah en realidad ", "perdon es ", "perdona es ",
    "me equivoque es ", "la correccion es ", "correccion: ", "la direccion es ",
    "la direccion correcta es ", "mejor pon "
  ];
  for (const prefix of correctionPrefixes) {
    if (normalizeText(newAddress).startsWith(normalizeText(prefix))) {
      newAddress = newAddress.slice(prefix.length).trim();
      break;
    }
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "ask_missing_data",
    reason: "user_corrected_address_during_booking_confirmation",
    message: `Anotado, actualizo la direccion a: ${newAddress}. Quieres que confirme la reserva con esa direccion?`,
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      service_address: newAddress,
      address: newAddress,
      stage: "booking_confirmation",
      last_bot_action: "confirm_address",
      next_goal: "create_calendar_booking",
      missing_fields: []
    },
    ruleName: "rule_address_correction_during_confirmation",
    priority: 88
  });
}
function ruleAttachmentNotSupported(ctx) {
  if (!hasAttachments(ctx.event)) return null;

  const hasService = !isMissing(ctx.leadState.service_interest);
  const hasVehicle = !isMissingField("vehicle_type", ctx.leadState);
  const hasDistrict = !isMissing(ctx.leadState.district);

  if (hasService && hasVehicle && hasDistrict) return null;

  const mentionsService = !!extractServiceInterestFromText(ctx.text);
  const mentionsPrice = userAsksPrice(ctx.text);

  if (mentionsService || mentionsPrice) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "attachment_received_cannot_view",
    message: "Por ahora no puedo ver fotos ni archivos adjuntos. Puedes describirme en texto el estado de tu vehiculo o que necesitas, y te ayudo con eso?",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      last_bot_action: "answer_question",
      missing_fields: []
    },
    ruleName: "rule_attachment_not_supported",
    priority: 82
  });
}

function isNonBookingQuestion(rawText) {
  const t = normalizeText(rawText);
  const hasBooking =
    t.includes('precio') || t.includes('valor') || t.includes('cuanto') ||
    t.includes('horario') || t.includes('agendar') || t.includes('reservar') ||
    t.includes('disponib') || t.includes('slot') || t.includes('cotiz') ||
    t.includes('cuanto sale') || t.includes('quiero lavar') || t.includes('quiero agendar');
  if (hasBooking) return false;
  const hasQ = t.includes('?') ||
    t.startsWith('como ') || t.startsWith('cual ') || t.startsWith('cuales ') ||
    t.startsWith('cuando ') || t.startsWith('donde ') || t.startsWith('tienen ') ||
    t.startsWith('hacen ') || t.startsWith('pueden ') || t.startsWith('atienden ') ||
    t.startsWith('incluye ') || t.startsWith('incluyen ') || t.startsWith('es ') ||
    t.startsWith('son ') || t.startsWith('tienen ') || t.startsWith('hay ') ||
    t.startsWith('se puede ') || t.startsWith('puedo ') || t.startsWith('tengo que ') ||
    t.startsWith('necesito saber') || t.startsWith('quiero saber') ||
    t.startsWith('si ') || t.startsWith('con que ') || t.startsWith('con quien ') ||
    t.startsWith('en caso de ') || t.startsWith('que pasa si ') ||
    t.includes('guardan ') || t.includes('es seguro') || t.includes('es privado') ||
    t.includes('incluye ') || t.includes('tienen garantia') || t.includes('politica') ||
    t.includes('que hago') || t.includes('que hago si') || t.includes('que debo hacer');
  return hasQ;
}

function ruleUnknownFAQ(ctx) {
  if (ctx.leadState.stage !== 'new_lead') return null;
  if (!isNonBookingQuestion(ctx.text)) return null;
  if (userComplaintIntent(ctx.text) || isAskingIfBot(ctx.text)) return null;
  return buildRuleResult({
    resolutionType: 'rule_based',
    action: 'ask_missing_data',
    reason: 'unknown_faq_question',
    message: 'Gracias por tu consulta. Para ese tipo de informacion, lo mejor es que hables directamente con nuestro equipo. Puedo conectarte, o si prefieres, te ayudo a cotizar y agendar tu servicio ahora.',
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: { last_bot_action: 'ask_missing_data', next_goal: 'offer_booking' },
    ruleName: 'rule_unknown_faq',
    priority: 75
  });
}


function ruleMultiVehicleFaq(ctx) {
  // Catch when user asks about washing multiple vehicles simultaneously.
  // Respond with capacity policy before ruleMissingRequiredFields sends promo.
  const t = normalizeText(ctx.text);
  const isMultiVehicle =
    (t.includes("mi auto") && (t.includes("el de mi") || t.includes("de mi esposa") || t.includes("de mi esposo") || t.includes("de mi pareja") || t.includes("de mi hijo") || t.includes("de mi hija"))) ||
    (t.includes("dos autos") || t.includes("2 autos") || t.includes("dos carros") || t.includes("2 carros") || t.includes("dos vehiculos") || t.includes("2 vehiculos") || t.includes("dos coches") || t.includes("2 coches")) ||
    (t.includes("suv y sedan") || t.includes("sedan y suv") || t.includes("suv y hatchback") || t.includes("suv y camioneta") || t.includes("dos camionetas")) ||
    ((t.includes("lavan") || t.includes("pueden lavar") || t.includes("atienden")) && (t.includes("mismo dia y mismo horario") || t.includes("al mismo tiempo") || t.includes("juntos") || t.includes("a la vez") || t.includes("mismo horario") || t.includes("el mismo dia")));
  if (!isMultiVehicle) return null;

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "answer_question",
    reason: "multi_vehicle_capacity_faq",
    message: "Atendemos un vehículo a la vez, así que no podemos trabajar dos autos en el mismo horario. Pero sí podemos agendar los dos en turnos distintos el mismo día si hay disponibilidad. ¿Cuál querés agendar primero?",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {},
    ruleName: "rule_multi_vehicle_faq",
    priority: 85
  });
}


function ruleInlineCompleteBookingRequest(ctx) {
  // Only fire when NOT already in a late booking stage
  const stage = ctx.leadState.stage || "";
  if (["quoted","booking_selection","collecting_address","booking_confirmation","booked"].includes(stage)) {
    return null;
  }

  const t = normalizeText(ctx.text);

  // Must have explicit service in text
  let service = null;
  if (t.includes("encerado full") || t.includes("encerado full")) service = "encerado_full";
  else if (t.includes("encerado")) service = "encerado_full";
  else if (t.includes("premium")) service = "lavado_premium";
  else if (t.includes("basico") || t.includes("básico")) service = "lavado_basico";
  if (!service) return null;

  // Must have explicit supported vehicle in text
  let vehicle = null;
  if (t.includes("camioneta")) vehicle = "camioneta";
  else if (t.includes("furgon") || t.includes("furgón")) vehicle = "furgon";
  else if (t.includes("suv")) vehicle = "suv";
  else if (t.includes("sedan") || t.includes("sedán")) vehicle = "sedan";
  // Note: 'moto' intentionally excluded (unsupported vehicle type)
  if (!vehicle) return null;

  // Must have explicit district in text
  const districtMap = {
    maipu: "maipu", maipú: "maipu",
    providencia: "providencia",
    nunoa: "nunoa", ñuñoa: "nunoa",
    "las condes": "las_condes",
    "la florida": "la_florida",
    vitacura: "vitacura",
    santiago: "santiago",
    huechuraba: "huechuraba",
    quilicura: "quilicura",
    "lo barnechea": "lo_barnechea",
    independencia: "independencia",
    recoleta: "recoleta",
    conchali: "conchali", conchalí: "conchali",
    "san bernardo": "san_bernardo",
    "puente alto": "puente_alto",
    macul: "macul",
    "pedro aguirre cerda": "pedro_aguirre_cerda",
    cerrillos: "cerrillos"
  };
  let district = null;
  for (const [key, val] of Object.entries(districtMap)) {
    if (t.includes(key)) { district = val; break; }
  }
  if (!district) return null;

  // Do not override if lead_state already has same context (would loop)
  if (ctx.leadState.service_interest === service &&
      ctx.leadState.vehicle_type === vehicle &&
      ctx.leadState.district === district) {
    return null;
  }

  return buildRuleResult({
    resolutionType: "rule_based",
    action: "send_quote",
    reason: "inline_complete_booking_request",
    message: "",
    missingFields: [],
    shouldCallLlm: false,
    stateUpdate: {
      service_interest: service,
      vehicle_type: vehicle,
      district: district,
      stage: "quoted",
      intent_last: "booking_requested_with_full_context",
      next_goal: "send_quote",
      last_bot_action: "send_quote_in_progress",
      missing_fields: []
    },
    ruleName: "rule_inline_complete_booking_request",
    priority: 89
  });
}

function ruleMissingRequiredFields(ctx) {
  const requiredFields = getRequiredFields(ctx.leadState.stage);
  const missingFields = requiredFields.filter((field) => isMissingField(field, ctx.leadState));

  if (missingFields.length > 0) {
    const missingServiceOnlyForPriceList =
      missingFields.length === 1 &&
      missingFields[0] === "service_interest" &&
      (ctx.leadState.intent_last === "price_list_requested" || ctx.leadState.intent_last === "quote_requested") &&
      !isMissingField("vehicle_type", ctx.leadState) &&
      !isMissing(ctx.leadState.district);

    if (missingServiceOnlyForPriceList) {
      return buildRuleResult({
        resolutionType: "rule_based",
        action: "send_quote",
        reason: "vehicle_and_district_received_for_price_list",
        message: "",
        missingFields: [],
        shouldCallLlm: false,
        stateUpdate: {
          stage: "qualified",
          intent_last: "price_list_ready",
          next_goal: "send_price_list",
          last_bot_action: "send_quote_in_progress",
          service_interest: null,
          fields_to_clear: ["service_interest"],
          vehicle_type: ctx.leadState.vehicle_type,
          district: ctx.leadState.district,
          missing_fields: []
        },
        ruleName: "rule_send_price_list_when_vehicle_and_district_ready",
        priority: 92
      });
    }
    const priceIntent = userAsksPrice(ctx.text);
    const missingService = missingFields.includes("service_interest");
    const missingVehicle = missingFields.includes("vehicle_type");
    const missingDistrict = missingFields.includes("district");

    let firstMissing = missingFields[0];
    let message = buildMissingFieldMessage(firstMissing);
    let nextGoal = buildNextGoal(firstMissing);
    let reason = 'required_fields_missing';
    let ruleName = 'rule_missing_required_fields';

    if (priceIntent) {
      reason = 'price_requested_but_required_fields_missing';
      ruleName = 'rule_missing_required_fields_for_price_request';

      if (missingService && missingVehicle) {
        firstMissing = "vehicle_type";
        nextGoal = "collect_vehicle_type";
        message = "Hola, te ayudo con el valor.\n\nPara enviarte la lista de precios necesito 2 datos:\n- Que vehiculo tienes: " + buildVehicleCategoriesPrompt("auto, SUV o camioneta") + "?\n- En que comuna seria el servicio?\n\nCon eso te mando los valores de " + buildServiceEnumerationText("lavado basico, lavado premium y encerado full") + ". Si alguno te acomoda, despues vemos horarios.";
      } else if (missingVehicle) {
        firstMissing = "vehicle_type";
        nextGoal = "collect_vehicle_type";
        message = "Hola, te ayudo con el valor. Para darte el precio correcto, dime que vehiculo tienes: " + buildVehicleCategoriesPrompt("auto, SUV o camioneta") + "?";
      } else if (missingService) {
        firstMissing = "service_interest";
        nextGoal = "collect_service_interest";
        message = "Hola, te ayudo con el valor. Con los datos de vehiculo y comuna te puedo mandar la lista de precios de " + buildServiceEnumerationText("lavado basico, lavado premium y encerado full") + ".";
      } else if (missingDistrict) {
        firstMissing = "district";
        nextGoal = "collect_district";
        message = "Hola, te ayudo con el valor. En que comuna seria el servicio?";
      }
    }

    return buildRuleResult({
      resolutionType: 'rule_based',
      action: 'ask_missing_data',
      reason,
      message,
      missingFields,
      shouldCallLlm: false,
      stateUpdate: {
        missing_fields: missingFields,
        next_goal: nextGoal,
        intent_last: priceIntent ? 'price_list_requested' : (ctx.leadState.intent_last || null),
        last_bot_action: 'ask_missing_data',
      },
      ruleName,
      priority: priceIntent ? 91 : 80,
    });
  }

  return null;
}

function ruleDefaultContinue() {
  return buildRuleResult({
    resolutionType: 'send_to_llm',
    action: null,
    reason: 'needs_commercial_interpretation',
    message: null,
    missingFields: [],
    shouldCallLlm: true,
    stateUpdate: {},
    ruleName: 'rule_default_continue',
    priority: 0,
  });
}

const ctx = {
  event,
  lead,
  leadState: enrichedLeadState,
  memory,
  businessRules,
  agentBusinessConfig,
  organization,
  agent,
  agentRules,
  agentTools,
  agentStaff,
  routing,
  configUsed,
  text,
  textLower,
};

const rules = [
  ruleHumanHandoffLocked,
  ruleExplicitHumanRequest,
  ruleIsBot,
  ruleComplaintHandoff,
  ruleEmptyMessage,

  // Confirmacion de cambio de servicio pendiente: debe ir antes que
  // ruleCancelBooking porque el usuario puede confirmar diciendo "cancela".
  ruleShowMeSlotsAfterQuote,
  ruleConfirmServiceChangeCancelAndRebook,

  // Respuesta a "con quien prefieres agendar?" cuando el negocio tiene
  // mas de una persona y esta configurado para preguntar.
  ruleVehicleRuralClarificationReplyProvided,
  ruleStaffSelectionReplyProvided,

  // Acciones crticas operacionales
  ruleCancelTargetSelected,
  ruleCancelBooking,
  ruleRescheduleBooking,
  ruleCheckPaymentStatus,
  ruleAdditionalServiceRequestWhileBooked,
  ruleAlreadyBookedAcknowledgment,
  ruleGreetingWithActiveBooking,
  ruleAcknowledgeAfterPreServiceInstructions,
  ruleAcknowledgeAdditionalNoteAfterPreServiceInstructions,
  ruleCheckExistingAppointmentStatus,
  ruleChangeServiceRequiresCancelRebook,
  ruleServiceChangeTargetProvided,

  // Post-servicio: reseas y referidos
  ruleReferralIntent,
  rulePositivePostServiceFeedback,

  // Direccin / reserva activa
  ruleConfirmAddressIfWaitingAddress,
  ruleReturningCustomerReactivation,

  // Men, FAQ y consultas comerciales generales
  // Estas deben ir ANTES de disponibilidad,
  // porque frases como "servicios disponibles" contienen "disponible".
  rulePriceWithCompleteContextImmediate,
  ruleServiceMenuRequest,
  ruleServiceDetails,
  ruleWeekdayAvailabilityQuestion,
  ruleInlineCompleteBookingRequest,
  rulePaymentPreferenceSelected,
  ruleAskPaymentPreference,
  ruleImplicitAffirmationWithPayment,
  ruleBusinessFaqRouter,
  ruleCoverageQuestion,
  ruleRecommendServiceRequest,

  // Cotizacin explcita
  // Va antes de disponibilidad, porque "cuanto sale..." debe cotizar.

  ruleQuoteRequest,

  // Post-cotizacion: el cliente responde 'despus te aviso'
  ruleScheduleFollowupAfterQuote,

  // Horario manual: primero validar disponibilidad real

  // Objecion suave: el cliente dice que lo pensara
  ruleObjectionWillThink,

  ruleManualSlotAvailabilityCheck,

  // Seleccion, rechazo y confirmacion de reserva
  ruleCheaperAlternativeRequest,
  ruleDeclineOfferedSlots,
  ruleSelectOfferedSlot,
  ruleQuoteAcceptedOfferSlots,
  ruleAffirmativeAfterPriceListAskService,
  ruleServiceSelectedAfterPriceList,
  ruleConfirmBookingFromUserConfirmation,

  // Disponibilidad real
  ruleAvailabilityRequest,

  // Si ya tenemos servicio + vehiculo + comuna, se cotiza.
  ruleReQuoteOnChangedCommercialFieldBeforeBooking,
  ruleSendQuoteWhenCommercialContextComplete,

  // Si el usuario dice que el auto esta muy sucio, recomendamos premium y pedimos 1 dato
  ruleRecommendPremiumWhenVeryDirty,

  // ultimo filtro antes de mandar al LLM
  ruleVehicleRuralNeedsClarification,
  ruleAddressCorrectionDuringConfirmation,
  ruleAttachmentNotSupported,
  ruleMultiVehicleFaq,
  ruleUnknownFAQ,
  ruleMissingRequiredFields,
];

let ruleResult = null;
const ruleTrace = [];

for (const rule of rules) {
  const result = rule(ctx);
  ruleTrace.push({
    rule_name: rule.name || 'anonymous_rule',
    matched: !!result,
  });

  if (result) {
    ruleResult = result;
    break;
  }
}

if (!ruleResult) {
  ruleResult = ruleDefaultContinue();
}

/**
 * Incorporar datos detectados al state_update.
 * Importante:
 * - detectedStateUpdate va primero.
 * - ruleResult.state_update va despus para mantener next_goal, missing_fields y last_bot_action.
 */
ruleResult.state_update = {
  ...detectedStateUpdate,
  ...(ruleResult.state_update || {}),
};

/**
 * Seleccion de persona/calendario cuando el negocio tiene mas de un staff.
 * Punto unico de interseccion: cualquier regla que haya decidido "offer_available_slots"
 * pasa por aqui antes de devolver el resultado final. Si el negocio opera con una
 * sola persona (o sin filas en agent_staff), esto no cambia nada del comportamiento
 * actual.
 */
function getStaffSelectionMode() {
  return agentBusinessConfig?.config?.staff_selection_mode === "ask_customer"
    ? "ask_customer"
    : "auto";
}

function getEligibleStaffForService(serviceKey) {
  return agentStaff.filter((s) => {
    if (s.is_active === false) return false;
    const services = Array.isArray(s.services) ? s.services : [];
    return services.length === 0 || !serviceKey || services.includes(serviceKey);
  });
}

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickStaffAutomatically(eligibleStaff) {
  if (eligibleStaff.length === 0) return null;
  const index = hashString(leadState.lead_id) % eligibleStaff.length;
  return eligibleStaff[index];
}

function buildStaffOptionsMessage(eligibleStaff) {
  const lines = eligibleStaff.map((s, i) => `${i + 1}. ${s.name}`);
  return `Con quien prefieres agendar?\n\n${lines.join("\n")}\n\nResponde con el nombre o el numero de la opcion.`;
}

function staffNameWords(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function customerHasNoStaffPreference(rawText) {
  // Ojo: la lista va DENTRO de la funcion a proposito. Esta funcion se llama
  // desde ruleStaffSelectionReplyProvided, que corre en el loop de reglas
  // (arriba en el archivo); un "const" a nivel de modulo declarado aca abajo
  // quedaria en temporal dead zone y tiraria ReferenceError en runtime
  // -- las declaraciones de funcion se hoistean, las de const no.
  const signals = [
    "cualquiera",
    "cualquier",
    "el que sea",
    "la que sea",
    "da lo mismo",
    "me da igual",
    "no importa",
    "no tengo preferencia",
    "tu eliges",
    "usted elija",
    "el primero",
    "la primera",
    "quien este",
    "quien pueda",
  ];
  const t = normalizeText(rawText);
  if (!t) return false;
  return signals.some((signal) => t.includes(signal));
}

function findStaffInReply(rawText, eligibleStaff) {
  const t = normalizeText(rawText);
  if (!t || !Array.isArray(eligibleStaff) || eligibleStaff.length === 0) return null;

  // 1. Por numero de opcion ("1", "2") tal como se listan en el menu.
  const byNumber = t.match(/^\s*(\d+)\s*$/);
  if (byNumber) {
    const idx = Number(byNumber[1]) - 1;
    if (idx >= 0 && idx < eligibleStaff.length) return eligibleStaff[idx];
  }

  // 2. Nombre completo tal cual aparece en el menu ("camila (junior)").
  const byFullName = eligibleStaff.filter((s) => t.includes(normalizeText(s.name)));
  if (byFullName.length === 1) return byFullName[0];

  // 3. Nombre parcial: el cliente casi siempre responde solo "Camila", no
  //    "Camila (Junior)". Se compara por palabras del nombre de >=3 letras
  //    para no matchear por una sola letra o por conectores.
  const replyWords = staffNameWords(t);
  const byWord = eligibleStaff.filter((s) =>
    staffNameWords(s.name)
      .filter((w) => w.length >= 3)
      .some((w) => replyWords.includes(w))
  );

  // Si mas de una persona matchea (ej. dos "Camila"), no se adivina:
  // se devuelve null y la regla vuelve a preguntar.
  if (byWord.length === 1) return byWord[0];

  return null;
}

if (
  ruleResult.action === "offer_available_slots" &&
  !nextLeadStateStaffId(ruleResult)
) {
  const serviceKey =
    ruleResult.state_update?.service_interest || leadState.service_interest;
  const eligibleStaff = getEligibleStaffForService(serviceKey);

  if (eligibleStaff.length > 1 && getStaffSelectionMode() === "ask_customer") {
    ruleResult = buildRuleResult({
      resolutionType: "rule_based",
      action: "answer_question",
      reason: "staff_selection_required_before_slots",
      message: buildStaffOptionsMessage(eligibleStaff),
      missingFields: [],
      shouldCallLlm: false,
      stateUpdate: {
        ...ruleResult.state_update,
        intent_last: "staff_selection_pending",
        last_bot_action: "answer_question",
        missing_fields: [],
      },
      ruleName: "rule_ask_staff_selection",
      priority: 95,
    });
  } else if (eligibleStaff.length >= 1) {
    const picked =
      eligibleStaff.length === 1
        ? eligibleStaff[0]
        : pickStaffAutomatically(eligibleStaff);

    if (picked) {
      ruleResult.state_update.staff_id = picked.id;
      ruleResult.state_update.staff_name = picked.name;
      ruleResult.state_update.calendar_id = picked.calendar_id;
    }
  }
}

/**
 * Horario de trabajo y duracion por servicio.
 * Corre siempre que la decision final sea offer_available_slots, sin
 * importar por que regla se llego ahi (recien asignado, ya tenia staff
 * elegido de antes, negocio sin staff, etc). Si nada esta configurado,
 * 6.4 list_available_slots usa su propio horario por defecto (el actual).
 */
if (ruleResult.action === "offer_available_slots") {
  const resolvedStaffId = nextLeadStateStaffId(ruleResult);
  const resolvedStaff = resolvedStaffId
    ? agentStaff.find((s) => s.id === resolvedStaffId) || null
    : null;

  const staffSchedule = Array.isArray(resolvedStaff?.schedule)
    ? resolvedStaff.schedule
    : [];
  const agentSchedule = Array.isArray(agentBusinessConfig?.config?.schedule)
    ? agentBusinessConfig.config.schedule
    : [];
  const resolvedSchedule =
    staffSchedule.length > 0 ? staffSchedule : agentSchedule;

  if (resolvedSchedule.length > 0) {
    ruleResult.state_update.schedule = resolvedSchedule;
  }

  const resolvedServiceKey =
    ruleResult.state_update?.service_interest || leadState.service_interest;
  const serviceConfig = findServiceConfigByKey(
    { agentBusinessConfig },
    resolvedServiceKey
  );
  const resolvedDuration =
    Number(serviceConfig?.duration_minutes) ||
    Number(agentBusinessConfig?.config?.booking_policy?.duration_minutes_default) ||
    null;

  if (resolvedDuration) {
    ruleResult.state_update.duration_minutes = resolvedDuration;
  }
}

function nextLeadStateStaffId(result) {
  return result.state_update?.staff_id || leadState.staff_id || null;
}

/**
 * Si ya no faltan campos, dejamos missing_fields vaco.
 * Si siguen faltando, usamos los campos faltantes recalculados.
 */
const nextLeadState = {
  ...enrichedLeadState,
  ...(ruleResult.state_update || {}),
  missing_fields: Array.isArray(ruleResult.missing_fields)
    ? ruleResult.missing_fields
    : [],
};

return [
  {
    json: {
      event,
      lead,
      lead_state: nextLeadState,
      rule_result: ruleResult,
      memory,
      business_rules: businessRules,
      organization,
      agent,
      agent_business_config: agentBusinessConfig,
      agent_rules: agentRules,
      agent_tools: agentTools,
      agent_staff: agentStaff,
      routing,
      rule_trace: ruleTrace,
      config_used: configUsed,
    },
  },
];
