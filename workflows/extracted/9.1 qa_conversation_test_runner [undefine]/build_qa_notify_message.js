// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1 qa_conversation_test_runner  (workflow id undefined)
// Nodo:        build_qa_notify_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const passed = Number($json.passed || 0);
const total = Number($json.total || 0);
const message = `QA terminado: ${passed} / ${total} escenarios pasaron.`;
return [{ phone: "56930977617", message }];
