// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_manage_service  (workflow id bnQxcyxo3Hwwb7CK)
// Nodo:        compute_new_config_and_prices
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const upstream = $("validate_and_build_service_request").first().json;
const dbResult = $json || {};

function toBool(v) {
  return v === true || v === "t" || v === "true";
}

const isMember = toBool(dbResult.is_member);
const agentBelongs = toBool(dbResult.agent_belongs);
const configFound = toBool(dbResult.config_found);

let status = "ok";
if (!isMember) status = "forbidden";
else if (!agentBelongs) status = "agent_not_found";
else if (!configFound) status = "config_not_found";

if (status !== "ok") {
  return [{ json: { ...upstream, status } }];
}

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}
function sqlNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "NULL";
}
function sqlUuidOrNull(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  return isUuid ? "'" + text + "'::uuid" : "NULL::uuid";
}

const currentConfig = dbResult.current_config && typeof dbResult.current_config === "object" ? dbResult.current_config : {};
const currentVersion = Number(dbResult.current_version) || 0;
const activePricingVersionId = dbResult.active_pricing_version_id || null;

const currentServices = Array.isArray(currentConfig.services) ? currentConfig.services : [];
const service = upstream.service;
const action = upstream.action;
const prices = upstream.prices || [];

const serviceAlreadyExisted = currentServices.some((s) => s && s.key === service.key);

let newServices;
if (action === "add") {
  // upsert por key: si ya existia, se reemplaza (permite editar nombre/aliases/
  // descripcion sin necesitar una accion "edit" aparte); si no, se agrega.
  const cleanService = {
    key: service.key,
    name: service.name,
    aliases: service.aliases,
    description: service.description || "",
    duration_minutes: service.duration_minutes,
  };
  newServices = currentServices.filter((s) => !s || s.key !== service.key);
  newServices.push(cleanService);
} else {
  // remove: se quita del array. El historial no se pierde porque
  // agent_business_config es versionado (la fila vieja queda con is_active=false,
  // nunca se borra) -- no hace falta un flag de soft-delete dentro del JSON.
  newServices = currentServices.filter((s) => !s || s.key !== service.key);
}

const newConfig = { ...currentConfig, services: newServices };

let priceSql = null;
let pricesAction = "none";
if (action === "add" && activePricingVersionId && prices.length > 0) {
  pricesAction = "insert";
  const values = prices
    .map((p) => `(${sqlUuidOrNull(activePricingVersionId)}, ${sqlText(service.key)}, ${sqlText(p.vehicle_type)}, ${sqlNumber(p.base_price)}, true)`)
    .join(",\n    ");
  priceSql = `INSERT INTO public.service_vehicle_prices (pricing_version_id, service_code, vehicle_type, base_price, is_active)\nVALUES\n    ${values}\nRETURNING id;`;
} else if (action === "remove" && activePricingVersionId) {
  pricesAction = "deactivate";
  priceSql = `UPDATE public.service_vehicle_prices\nSET is_active = false\nWHERE pricing_version_id = ${sqlUuidOrNull(activePricingVersionId)}\n  AND service_code = ${sqlText(service.key)}\n  AND is_active = true\nRETURNING id;`;
}

return [{
  json: {
    ...upstream,
    status,
    service_already_existed: serviceAlreadyExisted,
    new_config: newConfig,
    new_version: currentVersion + 1,
    active_pricing_version_id: activePricingVersionId,
    price_sql: priceSql,
    prices_action: pricesAction,
    prices_requested_count: prices.length,
  }
}];
