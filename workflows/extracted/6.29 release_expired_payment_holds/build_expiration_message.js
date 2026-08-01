// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
// Nodo:        build_expiration_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $("find_expired_holds").item.json;
const msg = "Tu link de pago vencio y el horario ya no esta reservado. Si aun quieres agendar, dime y te muestro los horarios disponibles.";

return [{
  channel: d.channel || "whatsapp",
  phone: d.phone,
  message: msg,
  message_to_send: msg,
  execution_context: {
    lead_id: d.lead_id,
    phone: d.phone,
    channel: d.channel || "whatsapp"
  }
}];
