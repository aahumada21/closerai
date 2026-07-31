// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        validate_schema_and_required_fields
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const parsed = $json.parsed_output;
const prepared = $('prepare_context_and_guardrail').first().json;
const allowedActions = prepared.allowed_actions || [];

const errors = [];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

if (!$json.parse_ok || !parsed) {
  errors.push('invalid_or_unparseable_output');
}

if (!isObject(parsed)) {
  errors.push('output_not_object');
}

if (parsed) {
  if (!isNonEmptyString(parsed.action)) errors.push('missing_action');
  else if (!allowedActions.includes(parsed.action)) errors.push('action_not_allowed');

  if (!isNonEmptyString(parsed.reason)) errors.push('missing_reason');

    const actionsThatCanBuildMessageLater = [
      'send_quote',
      'offer_available_slots',
      'confirm_booking',
      'send_service_menu',
      'recommend_service'
    ];
    
    if (
      !isNonEmptyString(parsed.message) &&
      !actionsThatCanBuildMessageLater.includes(parsed.action)
    ) {
      errors.push('missing_message');
    }
  if (!isObject(parsed.state_update)) {
    errors.push('missing_state_update');
  } else if (!Array.isArray(parsed.state_update.missing_fields)) {
    errors.push('missing_fields_must_be_array');
  }

  if (typeof parsed.confidence !== 'number' || Number.isNaN(parsed.confidence)) {
    errors.push('invalid_confidence');
  } else if (parsed.confidence < 0 || parsed.confidence > 1) {
    errors.push('confidence_out_of_range');
  }
}

return [{
  json: {
    parsed_output: parsed,
    schema_valid: errors.length === 0,
    schema_errors: errors,
    raw_response: $json.raw_response,
    raw_content: $json.raw_content,
    parse_source: $json.parse_source
  }
}];
