// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        save_audit_log1
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const finalDecisionNode = $('finalize_decision').first().json;
const preparedNode = $('prepare_context_and_guardrail').first().json;
const auditResult = $json;

const decision = finalDecisionNode.decision || null;
const contextPacket = preparedNode.context_packet || null;

if (!decision) {
  throw new Error('Missing decision in finalize_decision');
}

if (!contextPacket) {
  throw new Error('Missing context_packet in prepare_context_and_guardrail');
}

return [
  {
    json: {
      decision,
      context_packet: contextPacket,
      meta: {
        ...(finalDecisionNode.meta || {}),
        audit_saved: auditResult.success === true,
        source: 'llm_decision'
      }
    }
  }
];
