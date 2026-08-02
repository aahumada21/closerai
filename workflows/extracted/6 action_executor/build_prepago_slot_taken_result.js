// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6 action_executor  (workflow id 80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13)
// Nodo:        build_prepago_slot_taken_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const prepPayload = $("prepago_required_prep").first().json;
const ctx = prepPayload.execution_context || {};

const msg = "Justo en este momento ese horario se reservo para otro cliente. Si quieres, te muestro los horarios disponibles de nuevo.";

return [{
  ...prepPayload,
  channel: ctx.channel || "whatsapp",
  phone: ctx.phone || "",
  message_to_send: msg,
  message: msg,
  db_operations: ["messages", "lead_state"],
  execution_context: {
    ...ctx,
    action: "answer_question",
    message: msg,
    state_update: {
      ...(ctx.state_update || {}),
      stage: "booking_selection",
      intent_last: "selected_slot_unavailable",
      next_goal: "collect_selected_slot",
      last_bot_action: "answer_question",
      availability_confirmed: false,
      booking_date: null,
      booking_time: null,
      slot_id: null,
      pending_booking_data: null,
      fields_to_clear: ["booking_date", "booking_time", "slot_id", "pending_booking_data"],
      missing_fields: []
    }
  }
}];
