// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        sanitize_context_packet
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const cp = $json.context_packet || {};

function trimString(value, max = 500) {
  if (typeof value !== 'string') return value;
  return value.length > max ? value.slice(0, max) : value;
}

function uniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter(value => typeof value === 'string' && value.trim()))];
}

const sanitized = {
  organization: cp.organization || {},
  agent: cp.agent || {},
  agent_business_config: cp.agent_business_config || {},
  agent_rules: Array.isArray(cp.agent_rules) ? cp.agent_rules : [],
  agent_tools: Array.isArray(cp.agent_tools) ? cp.agent_tools : [],
  tools: Array.isArray(cp.tools) ? cp.tools : (Array.isArray(cp.agent_tools) ? cp.agent_tools : []),
  channel_config: cp.channel_config || {},
  routing: cp.routing || {},

  lead: {
    ...(cp.lead || {}),
    id: cp.lead?.id || cp.state?.lead_id || null,
    phone: cp.lead?.phone || cp.lead?.external_id || null,
    channel: cp.lead?.channel || 'whatsapp'
  },

  state: {
    ...(cp.state || {}),
    lead_id: cp.state?.lead_id || cp.lead?.id || null,
    missing_fields: uniqueStrings(cp.state?.missing_fields)
  },

  conversation: {
    latest_user_message: trimString(cp.conversation?.latest_user_message || '', 500),
    short_summary: trimString(cp.conversation?.short_summary || '', 800),
    last_message_id: cp.conversation?.last_message_id || null,
    message_type: cp.conversation?.message_type || 'text'
  },

  business: cp.business || cp.agent_business_config?.config || {},
  knowledge: {
    chunks: Array.isArray(cp.knowledge?.chunks) ? cp.knowledge.chunks.slice(0, 5) : [],
    source_ids: Array.isArray(cp.knowledge?.source_ids) ? cp.knowledge.source_ids : [],
    retrieval_ok: cp.knowledge?.retrieval_ok === true
  },
  rule_context: cp.rule_context || {},
  context_hints: cp.context_hints || {},
  allowed_actions: uniqueStrings(cp.allowed_actions)
};

if (!sanitized.lead.id) {
  throw new Error('sanitize_context_packet missing lead.id');
}

if (!sanitized.lead.phone) {
  throw new Error('sanitize_context_packet missing lead.phone');
}

return [
  {
    json: {
      context_packet: sanitized
    }
  }
];
