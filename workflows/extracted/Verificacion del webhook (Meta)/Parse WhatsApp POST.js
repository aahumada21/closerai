// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: Verificacion del webhook (Meta)  (workflow id 1911ad65-0194-4923-abc1-e3c069bb891e)
// Nodo:        Parse WhatsApp POST
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const entry = $json.body?.entry?.[0];
const change = entry?.changes?.[0];
const value = change?.value;

if (!value) {
  return [{ json: { event_type: 'unknown', raw: $json.body } }];
}

if (value.messages?.length) {
  const msg = value.messages[0];
  const contact = value.contacts?.[0];

  return [{
    json: {
      event_type: 'message',
      channel: 'whatsapp',
      from: msg.from,
      name: contact?.profile?.name || null,
      message_id: msg.id,
      timestamp: msg.timestamp,
      text: msg.text?.body || null,
      raw: $json.body
    }
  }];
}

if (value.statuses?.length) {
  return [{
    json: {
      event_type: 'status',
      channel: 'whatsapp',
      status: value.statuses[0],
      raw: $json.body
    }
  }];
}

return [{ json: { event_type: 'other', raw: $json.body } }];
