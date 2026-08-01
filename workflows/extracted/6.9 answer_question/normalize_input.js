// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.9 answer_question  (workflow id ce882890-6ea3-4784-879d-b1e1b4f8c5e9)
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
    "subworkflowanswer_questioninput_normalized"
  ]
}];
