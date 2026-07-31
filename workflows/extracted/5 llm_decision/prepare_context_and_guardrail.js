// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 5 llm_decision  (workflow id 8e8b11be-4a3d-4804-80ec-30582eeb5384)
// Nodo:        prepare_context_and_guardrail
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function asObject(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function uniqueStrings(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()))];
}

function normalizeTemplate(row) {
  const item = asObject(row);
  return {
    template_key: String(item.template_key || '').trim(),
    template_type: String(item.template_type || '').trim(),
    content: typeof item.content === 'string' ? item.content.trim() : '',
    version: Number.isFinite(Number(item.version)) ? Number(item.version) : null,
  };
}

function getTemplate(templates, key) {
  return templates.find(template => template.template_key === key && template.content)?.content || '';
}

function safeJson(value) {
  return JSON.stringify(value ?? null, null, 2);
}

const input = $json;
const contextPacket = asObject(input.context_packet);

if (!contextPacket || typeof contextPacket !== 'object') {
  throw new Error('context_packet missing or invalid');
}

const allowedActions = uniqueStrings(contextPacket.allowed_actions);

if (!allowedActions.length) {
  throw new Error('allowed_actions missing or empty');
}

const organization = asObject(contextPacket.organization);
const agent = asObject(contextPacket.agent);
const business = asObject(contextPacket.business);
const knowledge = asObject(contextPacket.knowledge);
const knowledgeChunks = asArray(knowledge.chunks).slice(0, 5).map(chunk => ({
  source_id: chunk.source_id || null,
  source_key: chunk.source_key || null,
  title: chunk.title || null,
  content: chunk.content || '',
  tags: Array.isArray(chunk.tags) ? chunk.tags : [],
  score: Number.isFinite(Number(chunk.score)) ? Number(chunk.score) : null,
}));
const tools = Array.isArray(contextPacket.tools)
  ? contextPacket.tools
  : asArray(contextPacket.agent_tools);
const routing = asObject(contextPacket.routing);
const state = asObject(contextPacket.state);
const conversation = asObject(contextPacket.conversation);

const promptTemplates = asArray(input.agent_prompt_templates)
  .map(normalizeTemplate)
  .filter(template => template.template_key && template.content);

const templateKeys = [
  'decision_prompt',
  'tone_policy',
  'business_boundaries',
  'output_schema',
  'fallback_policy'
];

const legacyDecisionPrompt = `
Eres la capa de decision de un AI Closer comercial.

Tu unica tarea es devolver UNA decision estructurada y valida.
No eres un agente libre.
No ejecutas herramientas.
No inventas acciones.
No escribes texto fuera del JSON.

Reglas base:
- action debe pertenecer a allowed_actions.
- Elige solo una action.
- No inventes acciones, precios, reservas ni horarios disponibles.
- state_update debe ser conservador y coherente.
- confidence debe ser un numero entre 0 y 1.
- Si el contexto es ambiguo, elige la opcion mas segura dentro de allowed_actions.
- No pidas mas de un dato faltante por turno.
`.trim();

const dynamicSections = templateKeys
  .map(key => getTemplate(promptTemplates, key))
  .filter(Boolean);

const developerPrompt = [
  dynamicSections.length ? dynamicSections.join('\n\n') : legacyDecisionPrompt,
  'Configuracion dinamica disponible:',
  `organization: ${safeJson(organization)}`,
  `agent: ${safeJson({
    id: agent.id || routing.agent_id || null,
    name: agent.name || null,
    role: agent.role || null,
    personality: agent.personality || {},
    policies: agent.policies || {},
  })}`,
  `business: ${safeJson(business)}`,
  `knowledge: ${safeJson({ chunks: knowledgeChunks, source_ids: asArray(knowledge.source_ids), retrieval_ok: knowledge.retrieval_ok === true })}`,
  'Usa knowledge para responder preguntas de servicios. Si no hay respaldo en business o knowledge, no inventes servicios ni inclusiones.',
  `tools: ${safeJson(tools)}`,
  `allowed_actions: ${safeJson(allowedActions)}`
].join('\n\n').trim();

const userPrompt = `
Analiza este context_packet y devuelve la mejor siguiente accion comercial.

Usa SOLO acciones dentro de allowed_actions.
Elige SOLO UNA accion.
No inventes datos.
No prometas cosas no respaldadas por el contexto.

Estado actual:
${safeJson(state)}

Conversacion:
${safeJson(conversation)}

Knowledge relevante:
${safeJson({ chunks: knowledgeChunks, source_ids: asArray(knowledge.source_ids), retrieval_ok: knowledge.retrieval_ok === true })}

Context packet completo:
${safeJson(contextPacket)}
`.trim();

const decisionSchema = {
  name: 'llm_decision_output',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      action: {
        type: 'string',
        enum: allowedActions
      },
      reason: {
        type: 'string'
      },
      message: {
        type: 'string'
      },
      state_update: {
        type: 'object',
        additionalProperties: false,
        properties: {
          stage: { type: ['string', 'null'] },
          next_goal: { type: ['string', 'null'] },
          intent_last: { type: ['string', 'null'] },

          service_interest: { type: ['string', 'null'] },
          service_scope: { type: ['string', 'null'] },
          vehicle_type: { type: ['string', 'null'] },
          mentioned_vehicle_type: { type: ['string', 'null'] },
confirmed_vehicle_type: { type: ['string', 'null'] },
mentioned_district: { type: ['string', 'null'] },
confirmed_district: { type: ['string', 'null'] },
          district: { type: ['string', 'null'] },
          service_address: { type: ['string', 'null'] },
          address: { type: ['string', 'null'] },
          address_reference: { type: ['string', 'null'] },
          address_confirmed: { type: ['boolean', 'null'] },

          booking_date: { type: ['string', 'null'] },
          booking_time: { type: ['string', 'null'] },
          slot_id: { type: ['string', 'null'] },
          availability_confirmed: { type: ['boolean', 'null'] },
          availability_window: {
            type: ["string", "null"],
            enum: ["this_week", "next_week", "next_14_days", "next_30_days", null]
          },
          
          availability_label: { type: ["string", "null"] },
          
          days_ahead: { type: ["number", "null"] },
          
          start_offset_days: { type: ["number", "null"] },
          
          max_slots: { type: ["number", "null"] },
          followup_type: { type: ['string', 'null'] },
          scheduled_for: { type: ['string', 'null'] },
          
          cancellation_reason: { type: ['string', 'null'] },
          reschedule_reason: { type: ['string', 'null'] },
          
          handoff_reason: { type: ['string', 'null'] },
          handoff_summary: { type: ['string', 'null'] },
          
          eta_minutes: { type: ['number', 'null'] },
          review_url: { type: ['string', 'null'] },
          referral_message: { type: ['string', 'null'] },
          
          human_handoff: { type: ['boolean', 'null'] },

          last_bot_action: { type: ['string', 'null'] },

          missing_fields: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: [
          "stage",
          "next_goal",
          "intent_last",
          "service_interest",
          "service_scope",
          "vehicle_type",
          "district",
          "mentioned_vehicle_type",
          "confirmed_vehicle_type",
          "mentioned_district",
          "confirmed_district",
          "service_address",
          "address",
          "address_reference",
          "address_confirmed",
          "booking_date",
          "booking_time",
          "slot_id",
          "availability_confirmed",
          "availability_window",
          "availability_label",
          "days_ahead",
          "start_offset_days",
          "max_slots",
          "followup_type",
          "scheduled_for",
          "cancellation_reason",
          "reschedule_reason",
          "handoff_reason",
          "handoff_summary",
          "eta_minutes",
          "review_url",
          "referral_message",
          "human_handoff",
          "last_bot_action",
          "missing_fields"
        ]
      },
      confidence: {
        type: 'number'
      }
    },
    required: [
      'action',
      'reason',
      'message',
      'state_update',
      'confidence'
    ]
  }
};

return [{
  json: {
    context_packet: contextPacket,
    allowed_actions: allowedActions,
    developer_prompt: developerPrompt,
    user_prompt: userPrompt,
    response_format: {
      type: 'json_schema',
      json_schema: decisionSchema
    },
    model_config: {
      model: agent.model_config?.model || 'gpt-5.4-mini',
      temperature: Number.isFinite(Number(agent.model_config?.temperature))
        ? Number(agent.model_config.temperature)
        : 0.1
    },
    prompt_config: {
      source: promptTemplates.length ? 'agent_prompt_templates' : 'legacy_fallback',
      agent_id: agent.id || routing.agent_id || null,
      organization_id: organization.id || routing.organization_id || null,
      prompt_version: Number.isFinite(Number(input.prompt_version)) ? Number(input.prompt_version) : null,
      template_keys: promptTemplates.map(template => template.template_key),
      knowledge_chunks_count: knowledgeChunks.length,
      knowledge_retrieval_ok: knowledge.retrieval_ok === true
    }
  }
}];
