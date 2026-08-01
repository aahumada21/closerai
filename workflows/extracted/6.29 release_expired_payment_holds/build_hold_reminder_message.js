// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.29 release_expired_payment_holds  (workflow id j4DjI0eQ0eOYpAnJ)
// Nodo:        build_hold_reminder_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $("find_holds_needing_reminder").item.json;
const msg = "Recordatorio: tu horario reservado se libera en unos minutos si no completamos el pago. Aqui esta tu link de nuevo:\n" + (d.flow_payment_url || "");

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
