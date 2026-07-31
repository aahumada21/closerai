// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.19 answer_objection  (workflow id 1823781d-ffb8-4c74-8729-6877a3cdc83e)
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
    "subworkflowanswer_objectioninput_normalized"
  ]
}];
