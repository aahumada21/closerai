// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.21 schedule_followup  (workflow id 9a8541cd-8c27-4aa1-9d93-4a2a290bfe74)
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
    "subworkflowschedule_followupinput_normalized"
  ]
}];
