// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
// Nodo:        Code_Evaluate_Eligibility
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const row = $json;

const allowedStartHour = 9;
const allowedEndHour = 21;
const recentReplyMinutes = 180;

const now = new Date();
const scheduledFor = row.scheduled_for ? new Date(row.scheduled_for) : null;
const followupCreatedAt = row.followup_created_at
  ? new Date(row.followup_created_at)
  : row.created_at
    ? new Date(row.created_at)
    : null;

const lastInboundAt = row.last_inbound_at ? new Date(row.last_inbound_at) : null;

const currentHour = Number(
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    hour12: false
  }).format(now)
);

const followupType = row.followup_type || 'generic_followup';

let shouldSend = true;
let skipReason = null;
let nextStatus = null;

function cancel(reason) {
  shouldSend = false;
  skipReason = reason;
  nextStatus = 'cancelled';
}

function fail(reason) {
  shouldSend = false;
  skipReason = reason;
  nextStatus = 'failed';
}

function requeue(reason) {
  shouldSend = false;
  skipReason = reason;
  nextStatus = 'pending';
}

// 1. scheduled_for vlido
if (!scheduledFor || isNaN(scheduledFor.getTime())) {
  fail('missing_or_invalid_scheduled_for');
}

// 2. horario permitido
if (shouldSend && (currentHour < allowedStartHour || currentHour >= allowedEndHour)) {
  requeue('outside_allowed_hours');
}

// 3. opt-out
if (shouldSend && row.opt_out === true) {
  cancel('lead_opted_out');
}

// 4. handoff humano
if (shouldSend && row.human_handoff === true) {
  cancel('human_handoff_active');
}

// 5. reglas por tipo de follow-up
if (shouldSend) {
  const isQuoteFollowup = [
    'quote_no_reply_24h',
    'quote_no_reply_48h',
    'interest_nudge_6h'
  ].includes(followupType);

  const isAppointmentReminder = [
    'appointment_reminder_1d',
    'appointment_reminder_1h'
  ].includes(followupType);

  const isPostServiceReview = [
    'post_service_review_24h'
  ].includes(followupType);

  // Seguimiento comercial: no enviar si ya reserv o tiene cita
  if (isQuoteFollowup) {
    if (row.stage === 'booked') {
      cancel('lead_already_booked');
    } else if (row.appointment_id) {
      cancel('appointment_exists');
    } else if (
      lastInboundAt &&
      followupCreatedAt &&
      lastInboundAt > followupCreatedAt
    ) {
      cancel('lead_replied_after_followup_created');
    }
  }

  // Recordatorios de cita: requieren cita existente
  if (shouldSend && isAppointmentReminder) {
    if (!row.appointment_id) {
      cancel('missing_appointment_for_reminder');
    } else if (!['confirmed', 'booked'].includes(row.appointment_status)) {
      cancel('appointment_not_active');
    }
  }

  // Resea post-servicio: no enviar si est en problema/handoff
  if (shouldSend && isPostServiceReview) {
    if (row.stage === 'human_handoff') {
      cancel('human_handoff_active');
    }

    // Si despus manejas status completed, puedes endurecer esta regla:
    // if (row.appointment_status !== 'completed') cancel('appointment_not_completed');
  }
}

// 6. respondi muy recientemente
// Esto aplica para followups comerciales, no para recordatorios de cita
if (
  shouldSend &&
  lastInboundAt &&
  ['quote_no_reply_24h', 'quote_no_reply_48h', 'interest_nudge_6h', 'generic_followup'].includes(followupType)
) {
  const diffMinutes = (now - lastInboundAt) / 1000 / 60;

  if (diffMinutes <= recentReplyMinutes) {
    cancel('recent_inbound_reply');
  }
}

return [{
  json: {
    ...row,
    should_send: shouldSend,
    skip_reason: skipReason,
    next_status: nextStatus
  }
}];
