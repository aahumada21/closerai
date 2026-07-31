// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
// Nodo:        parse_chat_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

const chatInput =
  input.chatInput ||
  input.text ||
  input.message ||
  input.input ||
  '';

const chatSessionId =
  input.sessionId ||
  input.chatSessionId ||
  input.chat_id ||
  input.conversationId ||
  'manual_chat_session';

const text = String(chatInput || '').trim();

const numberCommandMatch = text.match(/^\/(?:numero|n¿mero|phone)\s+(\+?\d[\d\s+-]*)$/i);

let requestedPhone = null;

if (numberCommandMatch) {
  requestedPhone = numberCommandMatch[1].replace(/\D/g, '');

  // Si colocas 949186386, lo convierte a 56949186386
  if (!requestedPhone.startsWith('56') && requestedPhone.length === 9) {
    requestedPhone = `56${requestedPhone}`;
  }
}

return [
  {
    json: {
      raw_chat_payload: input,
      chat_session_id: chatSessionId,
      text,
      is_number_command: Boolean(requestedPhone),
      requested_phone: requestedPhone,
      timestamp: new Date().toISOString()
    }
  }
];
