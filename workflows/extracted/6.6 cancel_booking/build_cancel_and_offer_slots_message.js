// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.6 cancel_booking  (workflow id 776d144a-7bf8-472c-9d6a-1bbc711872ea)
// Nodo:        build_cancel_and_offer_slots_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const slotsResult = $json;
const cancelNote = "Listo, cancele tu reserva anterior.";
const slotsMessage = slotsResult.message_to_send || slotsResult.message || "";

const combinedMessage = slotsMessage
  ? `${cancelNote} ${slotsMessage}`
  : cancelNote;

return [
  {
    json: {
      ...slotsResult,
      combined_cancel_message: combinedMessage
    }
  }
];
