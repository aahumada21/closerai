// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        normalize_audit_insert_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [
  {
    json: {
      ...$json,
      audit_id: $json.id || null,
      audit_flow_name: $json.flow_name || null,
      audit_decision: $json.decision || null,
      audit_meta: $json.meta || null,
      audit_idempotency_key: $json.idempotency_key || null,
      audit_inbound_message_id: $json.inbound_message_id || null,
      audit_outbound_message_id: $json.outbound_message_id || null
    }
  }
];
