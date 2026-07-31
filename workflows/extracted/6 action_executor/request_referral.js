// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        request_referral
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  ...$json,

  message_to_send:
    $json.message_to_send ||
    $json.decision?.message ||
    "S, feliz. Muchas gracias por recomendarnos. Puedes compartirle nuestro WhatsApp y decirle que viene recomendado por ti para atenderlo mejor.",

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...($json.state_update || {}),
    stage: "post_service",
    intent_last: "referral_requested",
    next_goal: "wait_for_referral_lead",
    last_bot_action: "request_referral",
    missing_fields: [],
    referral_requested_at: new Date().toISOString()
  },

  notes: [
    ...($json.notes || []),
    "request_referral_message_prepared"
  ]
}];
