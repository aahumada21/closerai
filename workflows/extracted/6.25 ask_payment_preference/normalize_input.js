// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.25 ask_payment_preference  (workflow id Ffnu4AoqCDEnxNJp)
// Nodo:        normalize_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

function parseMaybeJson(value, fallback) {
  if (fallback === undefined) fallback = {};
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch(e) { return fallback; }
}
const payload = parseMaybeJson($json.payload, {});
return [{
  ...payload,
  notes: [...(payload.notes || []), "subworkflow_ask_payment_preference_input_normalized"]
}];
