// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.7 ask_missing_data  (workflow id 6c5dad2d-492a-4ce1-966f-e36147b43100)
// Nodo:        normalize_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

const payload = parseMaybeJson($json.payload, {});
return [{
  ...payload,
  notes: [
    ...(payload.notes || []),
    "subworkflowask_missing_datainput_normalized"
  ]
}];
