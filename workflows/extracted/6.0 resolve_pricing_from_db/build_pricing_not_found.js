// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.0 resolve_pricing_from_db  (workflow id 72b60f14-db90-436e-b48c-02b96dd4f946)
// Nodo:        build_pricing_not_found
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  success: false,
  pricing_found: false,
  error_code: "pricing_rule_not_found",
  details: {
    service: $json.service_code || null,
    vehicle_type: $json.vehicle_type || null,
    district: $json.district_key || null,
    base_price: $json.base_price || null,
    final_price: $json.final_price || null
  }
}];
