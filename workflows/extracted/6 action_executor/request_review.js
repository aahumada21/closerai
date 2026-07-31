// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        request_review
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
    "Qu bueno saberlo, muchas gracias. Nos ayuda mucho tu opinin. Te gustara dejarnos una resea breve para que ms personas puedan conocer el servicio?",

  db_operations: ["messages", "lead_state"],

  state_update: {
    ...($json.state_update || {}),
    stage: "post_service",
    intent_last: "review_requested",
    next_goal: "wait_for_review",
    last_bot_action: "request_review",
    missing_fields: [],
    review_requested_at: new Date().toISOString()
  },

  notes: [
    ...($json.notes || []),
    "request_review_message_prepared"
  ]
}];
