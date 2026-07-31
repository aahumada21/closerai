// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.1 send_outbound_message  (workflow id a0d615e2-41de-4f01-bb5a-2a5bee00d803)
// Nodo:        normalize_provider_response
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const providerResponse = $json;
const originalInput = $("validate_outbound_input").first().json;

const hasError = providerResponse.error !== undefined;

return [{
  json: {
    ...originalInput,
    success: !hasError,
    message_sent: !hasError,
    provider_message_id: providerResponse.messages?.[0]?.id || null,
    provider_status: hasError ? "failed" : "accepted",
    provider_error: hasError ? providerResponse.error : null,
    provider_raw_response: providerResponse,
    message_type: originalInput.message_type || "text"
  }
}];
