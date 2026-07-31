// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        filter_available_slots
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const base = $("generate_candidate_slots").first().json;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const dbBusyRow = ($items("DB_Check_Busy_Appointments", 0, 0)[0] || {}).json || {};
const dbBusyEventsRaw = asArray(dbBusyRow.busy_events).map(event => ({
  id: event.event_id || event.id || null,
  event_id: event.event_id || event.id || null,
  start_at: event.start_at,
  end_at: event.end_at,
  status: event.status || "confirmed",
  source: event.source || "appointments_db"
}));

function safeItems(nodeName) {
  try {
    return $items(nodeName, 0, 0).map((item) => item.json || {});
  } catch {
    return [];
  }
}

const rawCalendarEvents = [
  ...safeItems("Get calendar busy events"),
  ...safeItems("split_oauth_busy_events")
];

// Collect event IDs of QA events from GCal (summary contains "cliente qa")
const qaEventIds = new Set(
  rawCalendarEvents
    .filter(e => e.id && String(e.summary || "").trim().toLowerCase().includes("cliente qa"))
    .map(e => e.id)
);

// Filter DB events: exclude QA appointments by matching GCal QA event IDs
const dbBusyEvents = dbBusyEventsRaw.filter(event => !qaEventIds.has(event.event_id));

// Filter GCal events: always exclude "cliente qa" events
const calendarBusyEvents = rawCalendarEvents
  .filter(event => event.id && event.status !== "cancelled")
  .filter(event => !String(event.summary || "").trim().toLowerCase().includes("cliente qa"))
  .map(event => ({
    start_at: (event.start || {}).dateTime || (event.start || {}).date || null,
    end_at: (event.end || {}).dateTime || (event.end || {}).date || null,
    status: event.status || "confirmed",
    source: "google_calendar",
    id: event.id,
    summary: event.summary || null
  }));

const busyEvents = [...dbBusyEvents, ...calendarBusyEvents]
  .filter(event => event.status !== "cancelled");

const candidateSlots = asArray(base.candidate_slots);
const maxSlots = Number(base.max_slots || 3);

function overlaps(slot, event) {
  const slotStart = new Date(slot.slot_start_at).getTime();
  const slotEnd = new Date(slot.slot_end_at).getTime();
  const eventStart = new Date(event.start_at).getTime();
  const eventEnd = new Date(event.end_at).getTime();

  if (!Number.isFinite(slotStart)) return false;
  if (!Number.isFinite(slotEnd)) return false;
  if (!Number.isFinite(eventStart)) return false;
  if (!Number.isFinite(eventEnd)) return false;

  return slotStart < eventEnd && slotEnd > eventStart;
}

const availableSlots = candidateSlots
  .filter(slot => !busyEvents.some(event => overlaps(slot, event)))
  .slice(0, maxSlots);

return [{
  success: true,
  lead_id: base.lead_id,
  calendar_id: base.calendar_id,
  service_interest: base.service_interest,
  vehicle_type: base.vehicle_type,
  district: base.district,
  duration_minutes: base.duration_minutes,
  days_ahead: base.days_ahead,
  start_offset_days: base.start_offset_days,
  max_slots: base.max_slots,
  availability_window: base.availability_window,
  availability_label: base.availability_label,
  slots: availableSlots,
  busy_events: busyEvents,
  busy_events_db_count: dbBusyEvents.length,
  busy_events_calendar_count: calendarBusyEvents.length,
  checked_at: new Date().toISOString()
}];
