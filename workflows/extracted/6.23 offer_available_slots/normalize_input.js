// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.23 offer_available_slots  (workflow id 135d7590-2dab-4032-a3c8-ba36a0ef33d7)
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
    "subworkflowoffer_available_slotsinput_normalized"
  ]
}];
