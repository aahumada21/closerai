// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.16 request_referral  (workflow id 6c7c781d-08ff-41b8-ae57-33b4ad456249)
// Nodo:        build_outbound_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,

  lead_id: $json.lead_id,
  phone: $json.phone,
  channel: $json.channel,

  message: $json.message_to_send,
  message_type: $json.message_type || "text",

  source: "request_referral"
}];
