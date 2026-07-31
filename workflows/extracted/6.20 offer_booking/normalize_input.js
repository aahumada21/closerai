// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.20 offer_booking  (workflow id 1b5873b4-fe9b-4a9e-b207-1ee23790b51c)
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
    "subworkflowoffer_bookinginput_normalized"
  ]
}];
