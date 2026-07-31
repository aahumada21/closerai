return [{
  json: {
    ok: true,
    processed: false,
    reason: $json.not_processed_reason || "agent_channel_not_found_or_inactive",
    source: "qa_whatsapp_normalized_router",
    message: "QA event not processed because no active agent channel was found."
  }
}];
