// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1 qa_conversation_test_runner  (workflow id e52fdb10-dbcb-4f10-97f2-ef6248ca2982)
// Nodo:        build_run_prefix
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const runId = String($json.run_id || "");
const prefix = runId.replace(/_[^_]+$/, "");
return [{ run_prefix: prefix }];
