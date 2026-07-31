// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
// Nodo:        validate_and_build_service_request
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

const expectedToken = $env.ONBOARDING_API_TOKEN;
const providedToken = header("x-onboarding-token");

const userId = firstValue(body.user_id, body.userId);
const organizationId = firstValue(body.organization_id, body.organizationId);
const agentId = firstValue(body.agent_id, body.agentId);
const action = firstValue(body.action).toLowerCase();

const serviceInput = body.service && typeof body.service === "object" ? body.service : {};
const serviceKey = firstValue(serviceInput.key);
const serviceName = firstValue(serviceInput.name);
const serviceDescription = firstValue(serviceInput.description);
const serviceAliases = Array.isArray(serviceInput.aliases)
  ? serviceInput.aliases.map((a) => String(a).trim()).filter(Boolean)
  : [];
const durationMinutesRaw = serviceInput.duration_minutes;
const durationMinutes = Number.isFinite(Number(durationMinutesRaw)) ? Number(durationMinutesRaw) : null;

// "prices" es una lista de { <dimension_classification_key>: valor, base_price }.
// El nombre real de la columna en DB es "vehicle_type" por razones historicas (ver
// docs de la consolidacion del rules_engine: es el eje de clasificacion secundario
// generico -- tipo de vehiculo para detailing, categoria de estilista para salon,
// etc.) -- se acepta el body como "vehicle_type" o "classification_value" para no
// forzar al panel a conocer ese detalle interno.
const pricesInput = Array.isArray(body.prices) ? body.prices : [];
const prices = pricesInput
  .map((p) => ({
    vehicle_type: firstValue(p.vehicle_type, p.classification_value, p.value),
    base_price: Number(p.base_price),
  }))
  .filter((p) => p.vehicle_type && Number.isFinite(p.base_price));

let error = null;
if (!expectedToken) error = "missing_onboarding_token_config";
else if (!providedToken || providedToken !== expectedToken) error = "invalid_onboarding_token";
else if (!userId) error = "missing_user_id";
else if (!organizationId) error = "missing_organization_id";
else if (!agentId) error = "missing_agent_id";
else if (!["add", "remove"].includes(action)) error = "invalid_action";
else if (!serviceKey) error = "missing_service_key";
else if (action === "add" && !serviceName) error = "missing_service_name";

return [{
  json: {
    valid: !error,
    error,
    user_id: userId || null,
    organization_id: organizationId || null,
    agent_id: agentId || null,
    action: action || null,
    service: {
      key: serviceKey || null,
      name: serviceName || null,
      description: serviceDescription || "",
      aliases: serviceAliases,
      duration_minutes: durationMinutes,
    },
    prices,
  }
}];
