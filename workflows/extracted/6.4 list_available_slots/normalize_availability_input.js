// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        normalize_availability_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseScheduleArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const leadId = input.lead_id || null;
const agentId = input.agent_id || null;
const calendarId = input.calendar_id || "primary";
const durationMinutes = toNumber(input.duration_minutes, 120);
const daysAhead = toNumber(input.days_ahead, 7);
const startOffsetDays = toNumber(input.start_offset_days, 0);
const maxSlots = toNumber(input.max_slots, 3);

if (!leadId) {
  throw new Error("Missing lead_id");
}

const schedule = parseScheduleArray(input.schedule);

return [{
  lead_id: leadId,
  agent_id: agentId,
  calendar_id: calendarId,

  staff_id: input.staff_id || null,
  schedule,
  duration_minutes: durationMinutes,
  days_ahead: daysAhead,
  start_offset_days: startOffsetDays,
  max_slots: maxSlots,

  availability_window: input.availability_window || "this_week",
  availability_label: input.availability_label || "los proximos dias",

  service_interest: input.service_interest || null,
  vehicle_type: input.vehicle_type || null,
  district: input.district || null,
  timezone: "America/Santiago"
}];
