// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
// Nodo:        build_normalized_event
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const chatInput = $('parse_chat_input').first().json;
const session = $json;

const phone = String(session.assigned_phone || '').replace(/\D/g, '');

if (!phone || !phone.startsWith('56')) {
  throw new Error('Invalid assigned_phone for n8n_chat test session');
}

const now = new Date().toISOString();

return [
  {
    json: {
      channel: 'n8n_chat',
      lead_id: phone,
      phone,
      message_id: `n8n_chat_${chatInput.chat_session_id}_${Date.now()}`,
      timestamp: now,
      message_type: 'text',
      text: chatInput.text,
      attachments: [],
      contact: {
        wa_id: phone,
        name: session.assigned_name || `Test Chat ${phone}`
      },
      source_metadata: {
        provider: 'n8n_chat',
        chat_session_id: chatInput.chat_session_id,
        assigned_phone: phone,
        test_mode: true
      },
      raw_message: {
        chat_session_id: chatInput.chat_session_id,
        text: chatInput.text
      }
    }
  }
];
