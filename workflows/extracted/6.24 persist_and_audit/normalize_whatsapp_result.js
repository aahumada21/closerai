// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        normalize_whatsapp_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("build_outbound_message_payload").first().json;

const messageSent =
  $json.message_sent === true ||
  $json.success === true ||
  $json.status === "sent" ||
  $json.status === "accepted" ||
  $json.provider_status === "sent" ||
  $json.provider_status === "accepted" ||
  !!$json.provider_message_id ||
  !!$json.message_id ||
  !!$json.id;
return [{
  ...original,
  ...$json,

  message_sent: messageSent,

  provider_message_id:
    $json.provider_message_id ||
    $json.message_id ||
    $json.id ||
    null,

  provider_status:
  $json.provider_status ||
  $json.status ||
  (messageSent ? "sent" : "failed")
}];
