// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_create_agent  (workflow id OnHysjH5lvf77zbJ)
// Nodo:        validate_and_build_request
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const body = input.body || input;
const headers = input.headers || {};

function header(name) {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key] || "") : "";
}

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function stripAccents(value) {
  return String(value || "").split("").map(function (ch) {
    var code = ch.charCodeAt(0);
    var map = {
      225: "a", 224: "a", 228: "a", 226: "a",
      233: "e", 232: "e", 235: "e", 234: "e",
      237: "i", 236: "i", 239: "i", 238: "i",
      243: "o", 242: "o", 246: "o", 244: "o",
      250: "u", 249: "u", 252: "u", 251: "u",
      241: "n"
    };
    return map[code] || ch;
  }).join("");
}

function slugify(value) {
  return stripAccents(String(value || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

const expectedToken = $env.ONBOARDING_API_TOKEN;
const providedToken = header("x-onboarding-token");

const userId = firstValue(body.user_id, body.userId);
const organizationId = firstValue(body.organization_id, body.organizationId);
const agentName = firstValue(body.agent_name, body.agentName);
const businessName = firstValue(body.business_name, body.businessName) || agentName;
const calendarId = firstValue(body.calendar_id, body.calendarId) || null;
const districts = Array.isArray(body.districts) ? body.districts.filter((d) => typeof d === "string" && d.trim()) : [];

const channelInput = body.channel && typeof body.channel === "object" ? body.channel : null;

let error = null;
if (!expectedToken) error = "missing_onboarding_token_config";
else if (!providedToken || providedToken !== expectedToken) error = "invalid_onboarding_token";
else if (!userId) error = "missing_user_id";
else if (!organizationId) error = "missing_organization_id";
else if (!agentName) error = "missing_agent_name";

const slug = agentName ? `${slugify(agentName)}-${randomSuffix()}` : null;

// Config inicial generica para la linea de detailing/lavado de autos.
// Pensada para editarse despues desde el panel (agent_business_config
// ya tiene RLS para que la propia organizacion la actualice).
const businessConfig = {
  business_name: businessName,
  locale: "es-CL",
  timezone: "America/Santiago",
  currency: "CLP",
  calendar_id: calendarId,

  coverage: {
    districts
  },

  staff_selection_mode: "auto",

  schedule: [
    { days: [1, 2, 3, 4, 5], start_time: "09:00", end_time: "18:00", slot_interval_minutes: 60 },
    { days: [6], start_time: "09:00", end_time: "14:00", slot_interval_minutes: 60 }
  ],

  booking_policy: {
    timezone: "America/Santiago",
    max_slots_default: 3,
    duration_minutes_default: 120,
    requires_address_confirmation: true,
    requires_availability_confirmation: true
  },

  pricing_policy: {
    source: "legacy_pricing_workflow",
    on_pricing_error: "handoff_or_retry_before_booking",
    must_not_invent_prices: true,
    requires_service_vehicle_district: true
  },

  agent_limits: {
    max_booking_options: 3,
    do_not_invent_availability: true,
    do_not_confirm_without_address: true,
    do_not_book_without_valid_quote: true
  },

  messages: {
    handoff: "Te derivo con una persona para revisar esto manualmente.",
    no_slots: "Por ahora no encontre horarios disponibles para los proximos dias. Si quieres, te puedo derivar para revisar manualmente una hora.",
    ask_service: "Perfecto. Que servicio te interesa?",
    ask_district: "Perfecto. Para ayudarte bien, en que comuna estas?",
    ask_vehicle_type: "Perfecto. Para cotizar bien, que tipo de vehiculo tienes? Puede ser SUV, camioneta, hatchback, sedan, city car, moto o furgon."
  },

  service_aliases: {
    basico: "lavado_basico",
    "lavado basico": "lavado_basico",
    premium: "lavado_premium",
    "lavado premium": "lavado_premium",
    encerado: "encerado_full",
    cera: "encerado_full"
  },

  services: [
    {
      key: "lavado_basico",
      name: "Lavado basico",
      aliases: ["lavado basico", "basico", "simple", "normal"],
      description: "Mantencion rapida para dejarlo limpio por dentro y fuera.",
      includes: ["Lavado exterior de carroceria", "Aspirado rapido del interior"],
      duration_minutes: 60
    },
    {
      key: "lavado_premium",
      name: "Lavado premium",
      aliases: ["lavado premium", "premium", "detallado"],
      description: "Limpieza mas completa y detallada.",
      includes: ["Lavado exterior completo", "Aspirado interior completo", "Limpieza de tablero y consola"],
      duration_minutes: 120
    },
    {
      key: "encerado_full",
      name: "Encerado full",
      aliases: ["encerado", "encerado full", "cera"],
      description: "Proteccion y brillo para la pintura.",
      includes: ["Lavado exterior previo", "Aplicacion de cera o sellador", "Pulido y realce de brillo"],
      duration_minutes: 180
    }
  ]
};

return [{
  json: {
    valid: !error,
    error,
    user_id: userId || null,
    organization_id: organizationId || null,
    agent_name: agentName || null,
    description: `Agente de detailing/lavado creado por onboarding`,
    slug,
    business_config: businessConfig,
    channel: channelInput
  }
}];
