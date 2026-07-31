// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.22 handoff_human  (workflow id 0520cc38-8cfa-4188-a91a-b2ec332fed9c)
// Nodo:        normalize_handoff_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;

  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

return [{
  lead_id: $json.lead_id || null,
  reason: $json.reason || "handoff_requested",
  summary: $json.summary || "Sin resumen",
  lead: parseMaybeJson($json.lead, {}),
  state: parseMaybeJson($json.state, {}),
  conversation: parseMaybeJson($json.conversation, {}),
  metadata: parseMaybeJson($json.metadata, {})
}];
