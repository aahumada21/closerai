// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        return_decision_to_parent
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const finalNode = $('finalize_decision').first().json;
const preparedNode = $('prepare_context_and_guardrail').first().json;
const auditResult = $json;

const decision = finalNode.decision || null;
const contextPacket = preparedNode.context_packet || null;

if (!decision) {
  throw new Error('Missing decision in finalize_decision');
}

if (!contextPacket) {
  throw new Error('Missing context_packet in prepare_context_and_guardrail');
}

if (!contextPacket.lead?.id) {
  throw new Error('Missing lead.id in context_packet before returning to parent');
}

if (!contextPacket.lead?.phone) {
  throw new Error('Missing lead.phone in context_packet before returning to parent');
}

return [
  {
    json: {
      decision,
      context_packet: contextPacket,
      meta: {
        ...(finalNode.meta || {}),
        source: 'llm_decision',
        audit_saved: auditResult.success === true,
        prompt_config: preparedNode.prompt_config || null
      }
    }
  }
];
