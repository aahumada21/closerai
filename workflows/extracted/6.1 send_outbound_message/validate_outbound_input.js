// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.1 send_outbound_message  (workflow id a0d615e2-41de-4f01-bb5a-2a5bee00d803)
// Nodo:        validate_outbound_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

const allowedChannels = ['whatsapp', 'n8n_chat', 'webchat'];

if (!input.channel) throw new Error('Missing channel');
if (!allowedChannels.includes(input.channel)) throw new Error('Unsupported channel: ' + input.channel);
if (!input.phone) throw new Error('Missing phone');
if (!input.message || typeof input.message !== 'string' || input.message.trim() === '') throw new Error('Invalid message');

function fixMojibake(value) {
  const text = String(value || '');

  const latin1Fixed = text.replace(/[\u00C3\u00C2][\u0080-\u00BF]/g, (chunk) => {
    try {
      return Buffer.from(chunk, 'latin1').toString('utf8');
    } catch {
      return chunk;
    }
  });

  const replacements = [
    ['\u252c\u2510', '\u00bf'],
    ['\u252c\u00ed', '\u00a1'],
    ['\u251c\u00ed', '\u00ed'],
    ['\u251c\u00a1', '\u00e1'],
    ['\u251c\u2310', '\u00e9'],
    ['\u251c\u2502', '\u00f3'],
    ['\u251c\u2551', '\u00fa'],
    ['\u251c\u2592', '\u00f1'],
    ['\u251c\u00e2', '\u00bf'],
    ['\u251c\u00a9', '\u00e9'],
    ['\ufffd', '']
  ];

  let fixed = latin1Fixed;
  for (const [from, to] of replacements) {
    fixed = fixed.split(from).join(to);
  }
  return fixed.trim();
}

// El formato Chile (56...) solo aplica al canal whatsapp (lo exige la API
// de WhatsApp Cloud). Otros canales (webchat, n8n_chat) usan su propio
// identificador de lead como 'phone' interno, no un numero real.
let phone = input.phone.toString();
if (input.channel === 'whatsapp') {
  phone = phone.replace(/\D/g, '');
  if (!phone.startsWith('56')) throw new Error('Phone must be Chile format (56...)');
}
const message = fixMojibake(input.message);

if (!message) throw new Error('Invalid message after mojibake fix');

return [{ json: { ...input, phone, message } }];
