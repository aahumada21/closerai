// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 7 followup_scheduler  (workflow id 9269385d-9ee4-4c85-9351-77f8e9aa872e)
// Nodo:        Code_Build_Output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const items = $input.all();

let executed = 0;
let skipped = 0;
let errors = 0;

for (const item of items) {
  const t = item.json.result_type;
  if (t === 'executed') executed++;
  else if (t === 'skipped') skipped++;
  else if (t === 'error') errors++;
}

return [{
  json: {
    executed_followups: executed,
    skipped,
    errors
  }
}];
