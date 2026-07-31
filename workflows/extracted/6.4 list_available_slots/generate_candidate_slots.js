// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        generate_candidate_slots
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;

const durationMinutes = Number(input.duration_minutes || 120);
const daysAhead = Number(input.days_ahead || 14);
const maxSlots = Number(input.max_slots || 3);

// ===============================
// HORARIO DE TRABAJO (configurable)
// ===============================

// 0 = domingo
// 1 = lunes
// 2 = martes
// 3 = miercoles
// 4 = jueves
// 5 = viernes
// 6 = sabado

// Formato de cada regla: { days: [int,...], start_time: "HH:MM", end_time: "HH:MM", slot_interval_minutes: int }
// Se generan horas desde start_time hasta end_time (ambos incluidos) cada slot_interval_minutes.
// Si no llega un horario configurado (agent_business_config.config.schedule o
// agent_staff.schedule), se usa este default que reproduce el horario original
// fijo (martes y jueves 09:00, domingo 09:00 y 15:00).
const DEFAULT_SCHEDULE = [
  { days: [2], start_time: "09:00", end_time: "09:00", slot_interval_minutes: 60 },
  { days: [4], start_time: "09:00", end_time: "09:00", slot_interval_minutes: 60 },
  { days: [0], start_time: "09:00", end_time: "15:00", slot_interval_minutes: 360 }
];

function isValidScheduleRule(rule) {
  return (
    rule &&
    Array.isArray(rule.days) &&
    rule.days.length > 0 &&
    typeof rule.start_time === "string" &&
    typeof rule.end_time === "string" &&
    Number.isFinite(Number(rule.slot_interval_minutes)) &&
    Number(rule.slot_interval_minutes) > 0
  );
}

const inputSchedule = Array.isArray(input.schedule)
  ? input.schedule.filter(isValidScheduleRule)
  : [];

const scheduleRules = inputSchedule.length > 0 ? inputSchedule : DEFAULT_SCHEDULE;

function timesForRange(startTime, endTime, intervalMinutes) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  const times = [];
  for (let t = startTotal; t <= endTotal; t += intervalMinutes) {
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }
  return times;
}

function buildTimesByWeekday(rules) {
  const map = {};
  for (const rule of rules) {
    const times = timesForRange(rule.start_time, rule.end_time, Number(rule.slot_interval_minutes));
    for (const day of rule.days) {
      if (!map[day]) map[day] = [];
      for (const time of times) {
        if (!map[day].includes(time)) map[day].push(time);
      }
    }
  }
  for (const day of Object.keys(map)) {
    map[day].sort();
  }
  return map;
}

const timesByWeekday = buildTimesByWeekday(scheduleRules);

// ===============================
// FUNCIONES INTERNAS
// ===============================

function pad(n) {
  return String(n).padStart(2, "0");
}

function getChileDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);

  const map = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day)
  };
}

// Por ahora usamos UTC-4 para Chile.
// Ms adelante se puede hacer dinmico si necesitas mxima precisin con cambio de hora.
function chileLocalToIso(year, month, day, hour, minute = 0) {
  const localString = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00-04:00`;
  return new Date(localString).toISOString();
}

function getWeekdayFromChileDate(year, month, day) {
  const date = new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00-04:00`);
  return date.getUTCDay();
}

function parseTime(timeString) {
  const [hour, minute] = String(timeString).split(":").map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Invalid time rule: ${timeString}`);
  }

  return { hour, minute };
}

// ===============================
// GENERAR HORARIOS CANDIDATOS
// ===============================

const now = new Date();
const candidates = [];

const startOffsetDays = Number(input.start_offset_days || 0);
const searchLengthDays = Number(input.days_ahead || 7);

for (let i = startOffsetDays; i <= startOffsetDays + searchLengthDays + 14; i++) {
  const future = new Date(now);
  future.setUTCDate(future.getUTCDate() + i);

  const parts = getChileDateParts(future);
  const weekday = getWeekdayFromChileDate(parts.year, parts.month, parts.day);

  const dayTimes = timesByWeekday[weekday];

  if (!dayTimes || dayTimes.length === 0) continue;

  for (const timeString of dayTimes) {
    const { hour, minute } = parseTime(timeString);

    const startIso = chileLocalToIso(
      parts.year,
      parts.month,
      parts.day,
      hour,
      minute
    );

    const endIso = new Date(
      new Date(startIso).getTime() + durationMinutes * 60 * 1000
    ).toISOString();

    // Evita ofrecer horarios que ya pasaron
    if (new Date(startIso).getTime() <= now.getTime()) continue;

    const slotDate = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
    const slotTime = `${pad(hour)}:${pad(minute)}`;

    candidates.push({
      slot_id: `${slotDate}_${slotTime}`,
      booking_date: slotDate,
      booking_time: slotTime,
      slot_start_at: startIso,
      slot_end_at: endIso
    });
  }

  if (candidates.length >= maxSlots + 10) break;
}

if (candidates.length === 0) {
  return [{
    ...input,
    candidate_slots: [],
    search_start_at: now.toISOString(),
    search_end_at: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString()
  }];
}

return [{
  ...input,
  candidate_slots: candidates,
  search_start_at: candidates[0].slot_start_at,
  search_end_at: candidates[candidates.length - 1].slot_end_at
}];
