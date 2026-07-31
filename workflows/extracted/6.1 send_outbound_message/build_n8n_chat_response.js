// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.1 send_outbound_message  (workflow id a0d615e2-41de-4f01-bb5a-2a5bee00d803)
// Nodo:        build_n8n_chat_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $("validate_outbound_input").first().json;

return [
  {
    json: {
      ...originalInput,
      success: true,
      message_sent: true,
      provider_message_id: `n8n_chat_${Date.now()}`,
      provider_status: "accepted",
      provider_error: null,
      provider_raw_response: {
        provider: "n8n_chat",
        simulated_delivery: true,
        chat_session_id: originalInput.chat_session_id || null
      },
      message_type: originalInput.message_type || "text"
    }
  }
];
