// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        build_audit_log_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const finalNode = $json;
const prepared = $('prepare_context_and_guardrail').first().json;
const parsedNode = $('parse_or_extract_structured_output').first().json;
const httpNode = $('HTTP Request').first().json;

const context = prepared.context_packet || {};
const lead = context.lead || {};
const state = context.state || {};
const conversation = context.conversation || {};

const usage = httpNode.usage || {};

const auditLog = {
  flow_name: 'llm_decision',
  lead_id: lead.id || lead.lead_id || lead.phone || lead.wa_id || null,
  channel: lead.channel || null,
  stage_before: state.stage || null,
  latest_user_message: conversation.latest_user_message || null,
  allowed_actions: prepared.allowed_actions || [],
  decision: finalNode.decision || null,
  meta: {
    fallback_used: finalNode.meta?.fallback_used || false,
    validation_errors: finalNode.meta?.validation_errors || [],
    validation_warnings: finalNode.meta?.validation_warnings || [],
    prompt_config: prepared.prompt_config || null,
    knowledge_chunks_count: context.knowledge?.chunks?.length || 0,
    knowledge_retrieval_ok: context.knowledge?.retrieval_ok === true
  },
  llm: {
    model: prepared.model_config?.model || null,
    parse_source: parsedNode.parse_source || null,
    raw_content: parsedNode.raw_content || null,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0
  },
  created_at: new Date().toISOString()
};

return [{ json: auditLog }];
