// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        finalize_decision
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json;
const prepared = $('prepare_context_and_guardrail').first().json;

const contextPacket = prepared.context_packet || {};
const decision = input.decision || null;

if (!decision || typeof decision !== 'object') {
  throw new Error('Missing decision in finalize_decision');
}

function cleanStateUpdate(update) {
  const cleaned = {};

  for (const [key, value] of Object.entries(update || {})) {
    if (value === undefined) continue;
    if (value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;

    cleaned[key] = value;
  }

  if (!Array.isArray(cleaned.missing_fields)) {
    cleaned.missing_fields = [];
  }

  if (!cleaned.last_bot_action) {
    cleaned.last_bot_action = decision.action;
  }

  return cleaned;
}

const finalDecision = {
  action: decision.action,
  reason: String(decision.reason || '').trim(),
  message: typeof decision.message === 'string' ? decision.message.trim() : '',
  state_update: cleanStateUpdate(decision.state_update || {}),
  confidence: Number.isFinite(Number(decision.confidence))
    ? Number(decision.confidence)
    : 0.2
};

return [
  {
    json: {
      valid: true,
      decision: finalDecision,
      context_packet: contextPacket,
      meta: {
        source: 'llm_decision',
        fallback_used: input.fallback_used === true,
        validation_errors:
          input.validation_errors ||
          input.original_validation_errors ||
          [],
        validation_warnings:
          input.validation_warnings ||
          input.original_validation_warnings ||
          [],
        prompt_config: prepared.prompt_config || null
      }
    }
  }
];
