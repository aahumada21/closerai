// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        build_outbound_message_payload
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const originalInput = $input.first().json;

// Soportar input envuelto en `payload` (string JSON u objeto) para llamadas desde otros workflows
// Regla: el contenido de `payload` debe poder completar/override campos faltantes del wrapper.
let input = $json;
if (typeof $json.payload === "string" && $json.payload.trim() !== "") {
  try {
    const parsed = JSON.parse($json.payload);
    if (parsed && typeof parsed === "object") {
      input = { ...$json, ...parsed };
    }
  } catch {
    // ignore
  }
} else if ($json.payload && typeof $json.payload === "object") {
  input = { ...$json, ...$json.payload };
}

const originalContext = originalInput.context_packet || {};
const currentContext = input.context_packet || originalContext || {};

const leadId =
  input.execution_context?.lead_id ||
  input.lead_id ||
  currentContext.lead?.id ||
  originalContext.lead?.id ||
  null;

const phone =
  currentContext.lead?.phone ||
  input.execution_context?.phone ||
  input.phone ||
  originalContext.lead?.phone ||
  null;

const channel =
  input.execution_context?.channel ||
  input.channel ||
  currentContext.lead?.channel ||
  originalContext.lead?.channel ||
  "whatsapp";

const chatSessionId =
  input.execution_context?.chat_session_id ||
  input.chat_session_id ||
  currentContext.conversation?.chat_session_id ||
  currentContext.source_metadata?.chat_session_id ||
  currentContext.event?.source_metadata?.chat_session_id ||
  originalContext.conversation?.chat_session_id ||
  originalContext.source_metadata?.chat_session_id ||
  originalContext.event?.source_metadata?.chat_session_id ||
  null;

if (!leadId) {
  throw new Error("Missing lead_id for outbound message");
}

if (!phone) {
  throw new Error("Missing phone for outbound message");
}

return [{
  ...input,

  lead_id: leadId,
  phone,
  channel,
  chat_session_id: chatSessionId,

  message: input.message_to_send || input.message || "",
  message_type: input.message_type || "text",

  context_packet: currentContext,

  execution_context: {
    ...(input.execution_context || {}),
    lead_id: leadId,
    phone,
    channel,
    chat_session_id: chatSessionId,
    action:
      input.execution_context?.action ||
      originalInput.decision?.action ||
      null
  },

  state_update: input.state_update || {},
  db_operations: input.db_operations || [],

  quote: input.quote || null,
  appointment: input.appointment || null,
  followup: input.followup || null,

  quote_db_id: input.quote_was_created === true ? (input.quote_db_id || null) : null,
quote_was_created: input.quote_was_created === true
}];
