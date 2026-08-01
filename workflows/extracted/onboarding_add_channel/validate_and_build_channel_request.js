// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: onboarding_add_channel  (workflow id 0rz0ue6OkEKRlqUG)
// Nodo:        validate_and_build_channel_request
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
const channelInput = body.channel && typeof body.channel === "object" ? body.channel : {};

const channel = firstValue(channelInput.channel);
const provider = firstValue(channelInput.provider);
const externalChannelId = firstValue(channelInput.external_channel_id, channelInput.externalChannelId);
const displayName = firstValue(channelInput.display_name, channelInput.displayName);
const wabaId = firstValue(
  channelInput.whatsapp_business_account_id,
  channelInput.waba_id,
  channelInput.wabaId
);

let error = null;
if (!expectedToken) error = "missing_onboarding_token_config";
else if (!providedToken || providedToken !== expectedToken) error = "invalid_onboarding_token";
else if (!userId) error = "missing_user_id";
else if (!organizationId) error = "missing_organization_id";
else if (!agentId) error = "missing_agent_id";
else if (!channel) error = "missing_channel";
else if (!provider) error = "missing_provider";
else if (!externalChannelId) error = "missing_external_channel_id";

// Config JSON estandar para el runtime omnicanal (ver agent_channels.config en
// docs/OMNICHANNEL_IMPLEMENTATION_GUIDE_2026-06-15.md). whatsapp_business_account_id
// (WABA id) es distinto del phone_number_id -- Meta necesita el WABA id para el paso
// de suscribir la app al webhook de esa cuenta (POST /{waba_id}/subscribed_apps),
// que es independiente de vincular el numero puntual. Se guarda ademas del
// phone_number_id porque una misma WABA puede tener varios numeros, y ese paso de
// suscripcion solo hace falta una vez por WABA, no por numero.
const config = {
  environment: "production",
  inbound_enabled: true,
  outbound_enabled: true,
  display_name: displayName || "",
  default_language: "es-CL",
  provider_credentials_ref: "",
  whatsapp_business_account_id: wabaId || "",
  rate_limit: { messages_per_minute: 60 },
  fallback_policy: { on_error: "handoff_or_retry" }
};

return [{
  json: {
    valid: !error,
    error,
    user_id: userId || null,
    organization_id: organizationId || null,
    agent_id: agentId || null,
    channel: channel || null,
    provider: provider || null,
    external_channel_id: externalChannelId || null,
    display_name: displayName || null,
    whatsapp_business_account_id: wabaId || null,
    config
  }
}];
