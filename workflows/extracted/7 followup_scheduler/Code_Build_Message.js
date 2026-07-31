// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
// Nodo:        Code_Build_Message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const row = $json;

const templates = {
  quote_no_reply_24h:
    'Hola, te escribo para ver si an te interesa el servicio que cotizamos. Si quieres, puedo ayudarte a revisar un horario disponible.',

  quote_no_reply_48h:
    'Hola, paso a cerrar el seguimiento de la cotizacin. Si todava te interesa, puedo ayudarte a agendar un horario.',

  interest_nudge_6h:
    'Hola, qued atento a tu mensaje anterior. Si quieres, te ayudo a avanzar con la reserva.',

  appointment_reminder_1d:
    'Hola, te recuerdo que tienes tu servicio agendado para maana. Si necesitas reprogramar, avsame por aqu.',

  appointment_reminder_1h:
    'Hola, te recuerdo que tu servicio es en aproximadamente 1 hora. Cualquier cosa, me avisas.',

  post_service_review_24h:
    'Hola, muchas gracias por confiar en nosotros. Si quedaste conforme con el servicio, nos podras dejar una resea? Nos ayuda mucho.',

  generic_followup:
    'Hola, te escribo para dar seguimiento a tu solicitud.'
};

const followupType = row.followup_type || 'generic_followup';

return [{
  json: {
    ...row,
    outbound_message: templates[followupType] || templates.generic_followup,
    channel: 'whatsapp',
    message_type: 'followup',
    source: 'followup_scheduler'
  }
}];
