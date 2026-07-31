// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.2 check_calendar_slot  (workflow id 9b16489e-ce39-4213-ab5d-270d035fa1e0)
// Nodo:        normalize_slot_check
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const slotContext = $items("build_slot_range", 0, 0)[0].json;
const calendarItems = $input.all();

// Filtramos solo items que realmente sean eventos
const realEvents = calendarItems.filter(item => {
  const j = item.json || {};
  if (!j.id) return false;

  // Ignore orphan QA artifacts left in Google Calendar. DB appointments remain the source
  // of truth for QA bookings, so stale Google-only "Cliente QA" events must not block slots.
  const summary = String(j.summary || "").trim().toLowerCase();
  if (summary.includes("cliente qa")) return false;

  return true;
});

// Ademas del calendario de Google, chequear contra las citas ya guardadas en
// nuestra propia base (appointments) -- antes este nodo solo miraba Google
// Calendar, asi que una cita real ya reservada (con su duracion completa) no
// bloqueaba un horario especifico que el cliente pidiera directamente si el
// calendario de Google no estaba sincronizado.
let dbBusyEvents = [];
try {
  const dbRow = ($items("DB_Check_Busy_Appointments", 0, 0)[0] || {}).json || {};
  const rawBusy = Array.isArray(dbRow.busy_events) ? dbRow.busy_events : [];
  const slotStartMs = new Date(slotContext.slot_start_at).getTime();
  const slotEndMs = new Date(slotContext.slot_end_at).getTime();
  dbBusyEvents = rawBusy.filter((event) => {
    const eventStart = new Date(event.start_at).getTime();
    const eventEnd = new Date(event.end_at).getTime();
    if (!Number.isFinite(eventStart) || !Number.isFinite(eventEnd)) return false;
    return slotStartMs < eventEnd && slotEndMs > eventStart;
  });
} catch {
  dbBusyEvents = [];
}

const hasEvents = realEvents.length > 0 || dbBusyEvents.length > 0;

return [{
  booking_date: slotContext.booking_date,
  booking_time: slotContext.booking_time,
  slot_id: slotContext.slot_id || null,
  calendar_id: slotContext.calendar_id || "primary",
  duration_minutes: slotContext.duration_minutes || 120,
  slot_start_at: slotContext.slot_start_at,
  slot_end_at: slotContext.slot_end_at,
  slot_available: !hasEvents,
  conflicting_events_count: realEvents.length + dbBusyEvents.length,
  conflicting_events: [
    ...realEvents.map(item => ({
      id: item.json.id || null,
      summary: item.json.summary || null,
      start: item.json.start || null,
      end: item.json.end || null
    })),
    ...dbBusyEvents.map(event => ({
      id: event.event_id || null,
      summary: 'appointments_db',
      start: event.start_at || null,
      end: event.end_at || null
    }))
  ]
}];
