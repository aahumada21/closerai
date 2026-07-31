// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.24 persist_and_audit  (workflow id e91c0748-bfd9-47e9-9a8c-9e6c2947b5f5)
// Nodo:        finalize_send_quote_state
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = (() => {
  try {
    return $("is_send_quote_with_quote").first().json;
  } catch {
    return {};
  }
})();

const data = {
  ...original,
  ...$json,
  execution_context: {
    ...(original.execution_context || {}),
    ...($json.execution_context || {})
  },
  context_packet: $json.context_packet || original.context_packet || {},
  state_update: {
    ...(original.state_update || {}),
    ...($json.state_update || {})
  }
};

const action =
  data.execution_context?.action ||
  data.decision?.action ||
  data.action ||
  null;

if (action !== "send_quote") {
  return [data];
}

const currentStage = data.context_packet?.state?.stage || null;

const ok =
  data.message_sent === true ||
  data.success === true ||
  data.status === "sent" ||
  data.status === "accepted" ||
  data.provider_status === "sent" ||
  data.provider_status === "accepted" ||
  !!data.provider_message_id;
return [{
  ...data,
  state_update: {
    ...(data.state_update || {}),

    stage: ok ? "quoted" : currentStage,
    intent_last: ok ? "quote_sent" : "quote_failed",

    last_bot_action: ok ? "send_quote" : "send_quote_failed",
    next_goal: ok ? "book_appointment" : "retry_quote",

    missing_fields: []
  },
  internal_status: ok ? "send_quote_completed" : "send_quote_failed"
}];
