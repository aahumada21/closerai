// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.5 confirm_booking_executor  (workflow id c4f365f3-8df3-49b1-8c88-8f4849fe1dd9)
// Nodo:        build_slot_unavailable_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const options = Array.isArray($json.context_packet?.state?.booking_options)
  ? $json.context_packet.state.booking_options
  : [];

const ctx = $json.execution_context || {};
const selectedSlotId = String(ctx.slot_id || $json.slot_id || "");
const selectedDate = String(ctx.booking_date || $json.booking_date || "");
const selectedTime = String(ctx.booking_time || $json.booking_time || "");

function sameSelectedSlot(slot) {
  const slotId = String(slot?.slot_id || "");
  const bookingDate = String(slot?.booking_date || "");
  const bookingTime = String(slot?.booking_time || "");
  return (
    (!!selectedSlotId && slotId === selectedSlotId) ||
    (!!selectedDate && !!selectedTime && bookingDate === selectedDate && bookingTime === selectedTime)
  );
}

function fmt(slot, idx) {
  const start = slot?.slot_start_at ? new Date(slot.slot_start_at) : null;
  if (!start || isNaN(start.getTime())) return `${idx + 1}. opcion ${idx + 1}`;

  const d = start.toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "long",
    day: "2-digit",
    month: "long"
  });

  const h = start.toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${idx + 1}. ${d} a las ${h}`;
}

const filteredOptions = options.filter((slot) => !sameSelectedSlot(slot));
const top = filteredOptions.slice(0, 3);
const lines = top.map((s, i) => fmt(s, i));
const listText = lines.length ? `\n\n${lines.join("\n")}` : "";
const tail = lines.length ? "\n\nCual te acomoda? Puedes responder con 1, 2 o 3." : "\n\nSi quieres, te propongo otro horario.";

return [{
  ...$json,
  message_to_send: `Ese horario ya no esta disponible. Te propongo estos horarios:${listText}${tail}`,
  db_operations: ["messages", "lead_state"],
  state_update: {
    ...($json.state_update || {}),
    stage: "booking_selection",
    intent_last: "selected_slot_unavailable",
    next_goal: "collect_selected_slot",
    last_bot_action: "offer_available_slots",
    availability_confirmed: false,
    booking_date: null,
    booking_time: null,
    slot_id: null,
    last_appointment_event_id: null,
    booking_options: top,
    missing_fields: []
  },
  execution_result: {
    success: true,
    action: "confirm_booking",
    outcome: "selected_slot_unavailable",
    bot: "Ese horario ya no esta disponible. Te propongo estos horarios:" + listText + tail,
    message_sent: false,
    state_updated: true,
    db_records_created: ["messages", "lead_state"],
    notes: ["slot_no_longer_available", "offered_new_slots_after_conflict"]
  },
  notes: ["slot_no_longer_available", "offered_new_slots_after_conflict"]
}];
