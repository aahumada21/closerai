// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: Payment Error Alerts  (workflow id mFtn3WnwBIU0k5uF)
// Nodo:        build_error_alert_message
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const d = $json;
const workflowName = d.workflow?.name || d.workflowName || "workflow desconocido";
const errorMessage = d.execution?.error?.message || d.error?.message || d.errorMessage || "error desconocido";
const nodeName = d.execution?.lastNodeExecuted || d.execution?.error?.node?.name || "";
const executionUrl = d.execution?.url || d.executionUrl || "";

const lines = [
  "ALERTA: fallo de ejecucion en pagos",
  "Workflow: " + workflowName
];
if (nodeName) lines.push("Nodo: " + nodeName);
lines.push("Error: " + errorMessage);
if (executionUrl) lines.push(executionUrl);

return [{ message: lines.join("\n") }];
