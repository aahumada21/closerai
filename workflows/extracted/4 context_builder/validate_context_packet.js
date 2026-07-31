// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 4 context_builder  (workflow id 5f5ef274-4b7a-4a1a-b463-ff22e5eae55e)
// Nodo:        validate_context_packet
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const contextPacket = input.context_packet || {};

const lead = contextPacket.lead || {};
const state = contextPacket.state || {};
const conversation = contextPacket.conversation || {};
const business = contextPacket.business || {};
const organization = contextPacket.organization || null;
const agent = contextPacket.agent || null;
const tools = contextPacket.tools || [];
const knowledge = contextPacket.knowledge || { chunks: [], source_ids: [], retrieval_ok: false };
const ruleContext = contextPacket.rule_context || {};
const contextHints = contextPacket.context_hints || {};

const leadId = lead.id || state.lead_id || null;
const phone = lead.phone || lead.external_id || null;
const channel = lead.channel || input.channel || "whatsapp";

const errors = [];

if (!leadId) errors.push("context_packet.lead.id missing");
if (!phone) errors.push("context_packet.lead.phone missing");
if (!channel) errors.push("context_packet.lead.channel missing");
if (!contextPacket.state || typeof contextPacket.state !== "object") errors.push("context_packet.state missing");
if (!contextPacket.conversation || typeof contextPacket.conversation !== "object") errors.push("context_packet.conversation missing");
if (!Array.isArray(contextPacket.allowed_actions)) errors.push("context_packet.allowed_actions must be array");
if (agent && typeof agent === "object" && !agent.id) errors.push("context_packet.agent.id missing");
if (!business || typeof business !== "object") errors.push("context_packet.business missing");
if (business.config_source === "agent_business_config" && !Array.isArray(business.services)) errors.push("context_packet.business.services must be array");
if (!Array.isArray(tools)) errors.push("context_packet.tools must be array");
if (!knowledge || typeof knowledge !== "object") errors.push("context_packet.knowledge missing");
if (knowledge && !Array.isArray(knowledge.chunks)) errors.push("context_packet.knowledge.chunks must be array");
if (knowledge && !Array.isArray(knowledge.source_ids)) errors.push("context_packet.knowledge.source_ids must be array");

if (errors.length > 0) {
  throw new Error(errors.join(" | "));
}

return [
  {
    json: {
      ...input,
      context_packet: {
        ...contextPacket,
        lead: {
          ...lead,
          id: leadId,
          phone,
          channel,
          external_id: lead.external_id || phone,
          name: lead.name || "Cliente"
        },
        state: {
          ...state,
          lead_id: state.lead_id || leadId,
          missing_fields: Array.isArray(state.missing_fields) ? state.missing_fields : []
        },
        organization,
        agent,
        business,
        tools,
        knowledge: {
          chunks: Array.isArray(knowledge.chunks) ? knowledge.chunks : [],
          source_ids: Array.isArray(knowledge.source_ids) ? knowledge.source_ids : [],
          retrieval_ok: knowledge.retrieval_ok === true
        },
        conversation: {
          message_type: conversation.message_type || "text",
          latest_user_message: conversation.latest_user_message || "",
          short_summary: conversation.short_summary || "",
          last_message_id: conversation.last_message_id || null,
          chat_session_id: conversation.chat_session_id || null
        },
        rule_context: ruleContext,
        context_hints: contextHints,
        allowed_actions: contextPacket.allowed_actions
      },
      validation: {
        context_packet_valid: true,
        validated_at: new Date().toISOString()
      }
    }
  }
];
