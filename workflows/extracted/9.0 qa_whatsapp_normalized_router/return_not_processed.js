// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.0 qa_whatsapp_normalized_router  (workflow id 1badeb35-0335-4aaa-96a6-2e021376db8a)
// Nodo:        return_not_processed
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{
  json: {
    ok: true,
    processed: false,
    reason: $json.not_processed_reason || "agent_channel_not_found_or_inactive",
    source: "qa_whatsapp_normalized_router",
    message: "QA event not processed because no active agent channel was found."
  }
}];
