// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 4 context_builder  (workflow id 5f5ef274-4b7a-4a1a-b463-ff22e5eae55e)
// Nodo:        return_context_packet_to_parent
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const contextPacket = input.context_packet || null;

if (!contextPacket || typeof contextPacket !== "object") throw new Error("Missing context_packet in context_builder output");
if (!contextPacket.lead || typeof contextPacket.lead !== "object") throw new Error("Missing context_packet.lead");
if (!contextPacket.lead.id) throw new Error("Missing context_packet.lead.id");
if (!contextPacket.lead.phone) throw new Error("Missing context_packet.lead.phone");
if (!contextPacket.lead.channel) contextPacket.lead.channel = "whatsapp";
if (!contextPacket.state || typeof contextPacket.state !== "object") throw new Error("Missing context_packet.state");
if (!contextPacket.state.lead_id) contextPacket.state.lead_id = contextPacket.lead.id;
if (!Array.isArray(contextPacket.state.missing_fields)) contextPacket.state.missing_fields = [];
if (!contextPacket.conversation || typeof contextPacket.conversation !== "object") contextPacket.conversation = {};

contextPacket.conversation.message_type = contextPacket.conversation.message_type || "text";
contextPacket.conversation.latest_user_message = contextPacket.conversation.latest_user_message || "";
contextPacket.conversation.short_summary = contextPacket.conversation.short_summary || "";
contextPacket.conversation.last_message_id = contextPacket.conversation.last_message_id || null;

if (!Array.isArray(contextPacket.allowed_actions)) contextPacket.allowed_actions = [];
if (!contextPacket.business || typeof contextPacket.business !== "object") {
  contextPacket.business = {
    services: [],
    pricing_policy: "",
    district_policy: "",
    booking_policy: "",
    currency: "CLP",
    config_source: "legacy_business_rules"
  };
}
if (!Array.isArray(contextPacket.tools)) contextPacket.tools = [];
if (!contextPacket.knowledge || typeof contextPacket.knowledge !== "object") {
  contextPacket.knowledge = { chunks: [], source_ids: [], retrieval_ok: false };
}
if (!Array.isArray(contextPacket.knowledge.chunks)) contextPacket.knowledge.chunks = [];
if (!Array.isArray(contextPacket.knowledge.source_ids)) contextPacket.knowledge.source_ids = [];
contextPacket.knowledge.retrieval_ok = contextPacket.knowledge.retrieval_ok === true;

return [
  {
    json: {
      context_packet: contextPacket,
      meta: {
        ...(input.meta || {}),
        source: "context_builder",
        returned_to_parent: true
      },
      validation: {
        ...(input.validation || {}),
        context_packet_valid: true
      }
    }
  }
];
