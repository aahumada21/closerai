// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.0 resolve_pricing_from_db  (workflow id 72b60f14-db90-436e-b48c-02b96dd4f946)
// Nodo:        normalize_pricing_keys
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function norm(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  if (["null", "undefined", "none", "n/a", "na"].includes(normalized)) return "";
  return normalized;
}

function canonicalService(value) {
  const service = norm(value);
  if (!service) return "";

  const map = {
    lavado_profundo: "lavado_premium",
    profundo: "lavado_premium",
    interior_full: "lavado_premium",
    limpieza_completa: "lavado_premium",
    completo: "lavado_premium",
    lavado_completo: "lavado_premium",
    lavado_esencial: "lavado_basico",
    esencial: "lavado_basico",
    basico: "lavado_basico",
    lavado_basico: "lavado_basico",
    lavado_de_mantencion: "lavado_basico",
    lavado_mantencion: "lavado_basico",
    mantencion: "lavado_basico",
    mantenimiento: "lavado_basico",
    lavado_premium: "lavado_premium",
    encerado_full: "encerado_full",
    encerado: "encerado_full"
  };

  return map[service] || service;
}

function canonicalVehicle(value) {
  const vehicle = norm(value);

  const map = {
    suv: "suv",
    jeep: "suv",
    "4x4": "suv",
    sedan: "sedan",
    auto: "sedan",
    automovil: "sedan",
    hatchback: "hatchback",
    hatch: "hatchback",
    hb: "hatchback",
    camioneta: "camioneta",
    pickup: "camioneta",
    pick_up: "camioneta"
  };

  return map[vehicle] || vehicle;
}

const input =
  $json.execution_context && typeof $json.execution_context === "object"
    ? { ...$json.execution_context, ...$json }
    : $json;

const service = canonicalService(input.service_interest || input.service_code || input.service);
const vehicle = canonicalVehicle(input.vehicle_type);
const district = norm(input.district || input.district_key);

const agentId = input.agent_id || null;

if (!agentId) {
  throw new Error("Missing pricing inputs: agent_id is required");
}

if (!vehicle || !district) {
  throw new Error(
    `Missing pricing inputs: vehicle=${vehicle || "empty"}, district=${district || "empty"}`
  );
}

return [
  {
    agent_id: agentId,
    service_code: service,
    price_list_requested: !service,
    vehicle_type: vehicle,
    district_key: district,
    original_inputs: {
      service_interest: input.service_interest || null,
      service_code: input.service_code || null,
      vehicle_type: input.vehicle_type || null,
      district: input.district || null,
      district_key: input.district_key || null
    },
    normalized_inputs: {
      service_code: service,
      vehicle_type: vehicle,
      district_key: district
    }
  }
];
