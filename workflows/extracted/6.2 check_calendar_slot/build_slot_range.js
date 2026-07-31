// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.2 check_calendar_slot  (workflow id 9b16489e-ce39-4213-ab5d-270d035fa1e0)
// Nodo:        build_slot_range
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const {
  lead_id,
  agent_id,
  booking_date,
  booking_time,
  slot_id,
  duration_minutes,
  calendar_id,
  timezone,
} = $json;

if (!booking_date || !booking_time || !slot_id) {
  throw new Error('Faltan datos requeridos: booking_date, booking_time o slot_id');
}

const zone = timezone || 'America/Santiago';
const duration = Number(duration_minutes || 120);

if (Number.isNaN(duration) || duration <= 0) {
  throw new Error('duration_minutes invlido');
}

const start = DateTime.fromISO(`${booking_date}T${booking_time}`, { zone });

if (!start.isValid) {
  throw new Error(`Fecha/hora invlida: ${start.invalidExplanation || 'sin detalle'}`);
}

const end = start.plus({ minutes: duration });

return [
  {
    json: {
      lead_id: lead_id || null,
      agent_id: agent_id || null,
      booking_date,
      booking_time,
      slot_id,
      duration_minutes: duration,
      calendar_id: calendar_id || 'primary',
      timezone: zone,

      slot_start_at: start.toUTC().toISO(),
      slot_end_at: end.toUTC().toISO(),

      slot_start_local: start.toISO(),
      slot_end_local: end.toISO(),
    }
  }
];
