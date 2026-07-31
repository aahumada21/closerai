// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.0 resolve_pricing_from_db  (workflow id 72b60f14-db90-436e-b48c-02b96dd4f946)
// Nodo:        build_pricing_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parsePriceList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object" && Array.isArray(value.items)) return value.items;
  return [];
}

const priceList = parsePriceList($json.price_list);
const priceListRequested =
  $json.price_list_requested === true ||
  String($json.price_list_requested).toLowerCase() === "true";

if (priceListRequested) {
  return [{
    success: priceList.length > 0,
    pricing_found: priceList.length > 0,
    price_list_requested: true,
    price_list: priceList,
    quote: null,
    normalized_inputs: {
      service_code: $json.service_code || null,
      vehicle_type: $json.vehicle_type || null,
      district_key: $json.district_key || null
    }
  }];
}

return [{
  success: true,
  pricing_found: true,
  price_list_requested: false,
  quote: {
    service: $json.service_code,
    vehicle_type: $json.vehicle_type,
    district: $json.district_key,
    pricing_version_id: $json.pricing_version_id,
    base_price: Number($json.base_price),
    surcharge: Number($json.surcharge || 0),
    price: Number($json.final_price)
  }
}];
