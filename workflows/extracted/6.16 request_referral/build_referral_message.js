// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.16 request_referral  (workflow id 6c7c781d-08ff-41b8-ae57-33b4ad456249)
// Nodo:        build_referral_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const customMessage = $json.referral_message;

const defaultMessage =
  "Si conoces a alguien que tambin quiera dejar su auto impecable, feliz nos puedes recomendar. Trabajamos a domicilio y coordinamos por WhatsApp.";

const message = customMessage && customMessage.trim() !== ""
  ? customMessage.trim()
  : defaultMessage;

return [{
  ...$json,
  message_to_send: message,
  message_type: "text",
  state_update: {
    ...($json.state_update || {}),
    stage: "post_service",
    next_goal: "reactivation_or_referral_tracking",
    last_bot_action: "request_referral",
    missing_fields: []
  },
  notes: [
    ...($json.notes || []),
    "referral_message_built"
  ]
}];
