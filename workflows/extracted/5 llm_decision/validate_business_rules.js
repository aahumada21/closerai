// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        validate_business_rules
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const parsed = $json.parsed_output;
const prepared = $('prepare_context_and_guardrail').first().json;

const context = prepared.context_packet || {};
const allowedActions = prepared.allowed_actions || [];

const state = context.state || {};
const ruleContext = context.rule_context || {};
const conversation = context.conversation || {};

const errors = [];
const warnings = [];

const latestUserMessage = conversation.latest_user_message || '';

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function firstValue(...values) {
  for (const value of values) {
    if (isFilled(value)) return value;
  }
  return null;
}

function compactObject(obj) {
  const out = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (value === undefined) continue;
    if (value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    out[key] = value;
  }

  return out;
}

if (!$json.schema_valid) {
  return [{
    json: {
      valid: false,
      validation_errors: $json.schema_errors || ['schema_invalid'],
      validation_warnings: [],
      decision: null,
      validation_meta: {
        allowed_actions: allowedActions,
        current_stage: state.stage || null,
        latest_user_message: latestUserMessage
      }
    }
  }];
}

if (!parsed || typeof parsed !== 'object') {
  return [{
    json: {
      valid: false,
      validation_errors: ['parsed_output_missing'],
      validation_warnings: [],
      decision: null,
      validation_meta: {
        allowed_actions: allowedActions,
        current_stage: state.stage || null,
        latest_user_message: latestUserMessage
      }
    }
  }];
}

const update = parsed.state_update || {};

const serviceInterest = firstValue(update.service_interest, state.service_interest);
const vehicleType = firstValue(update.vehicle_type, state.vehicle_type);
const district = firstValue(update.district, state.district);

const bookingDate = firstValue(
  update.booking_date,
  state.booking_date,
  ruleContext.booking_candidate?.booking_date
);

const bookingTime = firstValue(
  update.booking_time,
  state.booking_time,
  ruleContext.booking_candidate?.booking_time
);

const slotId = firstValue(
  update.slot_id,
  state.slot_id,
  ruleContext.booking_candidate?.slot_id,
  bookingDate && bookingTime ? `${bookingDate}_${bookingTime}` : null
);

const serviceAddress = firstValue(
  update.service_address,
  update.address,
  state.service_address,
  state.address,
  ruleContext.address_candidate?.address
);

const addressReference = firstValue(
  update.address_reference,
  state.address_reference,
  ruleContext.address_candidate?.address_reference
);

const addressConfirmed =
  update.address_confirmed === true ||
  state.address_confirmed === true;

const hasAddress =
  isFilled(serviceAddress) ||
  isFilled(addressReference) ||
  addressConfirmed;

const hasBookingContext =
  isFilled(state.pending_booking_slot) ||
  isFilled(state.booking_slot) ||
  isFilled(ruleContext.booking_candidate) ||
  isFilled(ruleContext.calendar_hold) ||
  (isFilled(bookingDate) && isFilled(bookingTime)) ||
  isFilled(slotId);

if (!allowedActions.includes(parsed.action)) {
  errors.push(`action_not_allowed:${parsed.action}`);
}

if (parsed.action === 'offer_available_slots') {
  if (!serviceInterest) errors.push('offer_available_slots_without_service_interest');
  if (!vehicleType) errors.push('offer_available_slots_without_vehicle_type');
  if (!district) errors.push('offer_available_slots_without_district');
}

if (parsed.action === 'send_quote') {
  if (!serviceInterest) errors.push('send_quote_without_service_interest');
  if (!vehicleType) errors.push('send_quote_without_vehicle_type');
  if (!district) errors.push('send_quote_without_district');
}

if (parsed.action === 'confirm_booking') {
  if (!serviceInterest) errors.push('confirm_booking_without_service_interest');
  if (!vehicleType) errors.push('confirm_booking_without_vehicle_type');
  if (!district) errors.push('confirm_booking_without_district');
  if (!bookingDate) errors.push('confirm_booking_without_booking_date');
  if (!bookingTime) errors.push('confirm_booking_without_booking_time');
  if (!hasBookingContext) errors.push('confirm_booking_without_booking_context');
  if (!hasAddress) errors.push('confirm_booking_without_address');
}

if (parsed.action === 'confirm_address') {
  const hasAddressCandidate =
    hasAddress ||
    isFilled(latestUserMessage);

  if (!hasAddressCandidate) {
    errors.push('confirm_address_without_address_candidate');
  }
}

if (parsed.action === 'collect_address') {
  const hasBookingCandidate =
    isFilled(bookingDate) ||
    isFilled(bookingTime) ||
    isFilled(slotId) ||
    Array.isArray(state.booking_options) && state.booking_options.length > 0;

  if (!hasBookingCandidate) {
    warnings.push('collect_address_without_booking_candidate');
  }
}

if (parsed.action === 'schedule_followup') {
  const followupType = firstValue(parsed.followup_type, update.followup_type, state.followup_type);
  const scheduledFor = firstValue(parsed.scheduled_for, update.scheduled_for, state.scheduled_for);

  if (!followupType) errors.push('schedule_followup_without_followup_type');
  if (!scheduledFor) errors.push('schedule_followup_without_scheduled_for');
}

if (parsed.action === 'handoff_human') {
  if (update.stage !== 'human_handoff') {
    warnings.push('handoff_without_human_handoff_stage');
  }
}

if (Number(parsed.confidence) < 0.45 && allowedActions.includes('handoff_human')) {
  warnings.push('low_confidence_recommend_handoff');
}

const normalizedStateUpdate = compactObject({
  ...(update || {}),

  slot_id: firstValue(update.slot_id, slotId),
  last_bot_action: firstValue(update.last_bot_action, parsed.action),

  missing_fields: Array.isArray(update.missing_fields)
    ? update.missing_fields
    : []
});

const normalizedDecision = {
  action: parsed.action,
  reason: String(parsed.reason || '').trim(),
  message: typeof parsed.message === 'string' ? parsed.message.trim() : '',
  state_update: normalizedStateUpdate,
  confidence: Number(parsed.confidence)
};

return [{
  json: {
    valid: errors.length === 0,
    validation_errors: errors,
    validation_warnings: warnings,
    decision: normalizedDecision,
    validation_meta: {
      allowed_actions: allowedActions,
      current_stage: state.stage || null,
      latest_user_message: latestUserMessage
    }
  }
}];
