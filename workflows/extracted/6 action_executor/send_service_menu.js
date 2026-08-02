// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        send_service_menu
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json;
const ctx = data.execution_context || {};
const contextPacket = data.context_packet || {};
const state = contextPacket.state || data.lead_state || {};
const rawBusinessConfig = data.agent_business_config?.config || data.agent_business_config || contextPacket.agent_business_config?.config || contextPacket.agent_business_config || null;
const business = rawBusinessConfig || data.business || contextPacket.business || {};

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const defaultAhumadaServices = [
  {
    key: "lavado_basico",
    name: "Lavado basico",
    description: "Mantencion rapida para dejarlo limpio por dentro y fuera. Buena opcion si buscas algo practico."
  },
  {
    key: "lavado_premium",
    name: "Lavado premium",
    description: "Limpieza mas completa y detallada. Recomendado si el auto viene bien sucio o quieres un resultado mas pro."
  },
  {
    key: "encerado_full",
    name: "Encerado full",
    description: "Proteccion y brillo para la pintura. Ideal si quieres mejorar la terminacion exterior y cuidar el auto."
  }
];

const leadId = firstValue(ctx.lead_id, contextPacket.lead?.id, data.lead?.id, data.lead_id);
const phone = firstValue(ctx.phone, contextPacket.lead?.phone, data.lead?.phone, data.phone);
const channel = firstValue(ctx.channel, contextPacket.lead?.channel, data.lead?.channel, data.channel, "whatsapp");

const businessName = cleanText(
  business.business_name ||
  data.organization?.name ||
  contextPacket.organization?.name ||
  data.agent?.name ||
  contextPacket.agent?.name ||
  "Ahumada Detailing"
);

const services = asArray(business.services)
  .map((service) => ({
    key: cleanText(service.key),
    name: cleanText(service.name || service.label || service.key),
    description: cleanText(service.description || service.summary || "")
  }))
  .filter((service) => service.name);

const menuServices = services.length > 0
  ? services
  : defaultAhumadaServices;

const lines = ["Gracias por escribir a " + businessName + ". Te ayudo a elegir el servicio ideal.", "", "Estas son las opciones principales:", ""];

menuServices.forEach((service, index) => {
  lines.push(String(index + 1) + ". " + service.name);
  if (service.description) lines.push(service.description);
  lines.push("");
});

const requiresPricingContext = business.pricing_policy?.requires_service_vehicle_district !== false;
if (requiresPricingContext) {
  lines.push("Para darte el valor exacto, dime que tipo de vehiculo tienes y en que comuna seria el servicio. Si no estas seguro, cuentame como esta tu auto y te recomiendo una opcion.");
} else {
  lines.push("Dime cual te interesa. Si no estas seguro, cuentame que necesitas y te recomiendo una opcion.");
}

const message = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
const vehicleType = firstValue(ctx.vehicle_type, state.vehicle_type);
const district = firstValue(ctx.district, state.district);
const missingFields = [];
if (requiresPricingContext && !vehicleType) missingFields.push("vehicle_type");
if (requiresPricingContext && !district) missingFields.push("district");

const stateUpdate = {
  ...(ctx.state_update || data.state_update || {}),
  stage: "service_discovery",
  intent_last: "service_menu_request",
  next_goal: requiresPricingContext ? "collect_vehicle_and_district" : "collect_service_interest",
  last_bot_action: "send_service_menu",
  missing_fields: missingFields
};

return [{
  ...data,
  lead_id: leadId,
  phone,
  channel,
  message_to_send: message,
  message,
  db_operations: ["messages", "lead_state"],
  state_update: stateUpdate,
  execution_context: {
    ...ctx,
    lead_id: leadId,
    phone,
    channel,
    action: "send_service_menu",
    message,
    state_update: stateUpdate,
    service_interest: firstValue(ctx.service_interest, state.service_interest),
    vehicle_type: vehicleType,
    district
  },
  execution_result: {
    success: true,
    action: "send_service_menu",
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: ["service_menu_sent", "service_menu_from_agent_business_config"]
  },
  notes: ["service_menu_sent", "service_menu_from_agent_business_config"]
}];
