// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.26 payment_request  (workflow id wlAAdOqo3vD7O18n)
// Nodo:        return_payment_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

return [{ ...($input.all()[0] || {json:$json}).json, payment_request_status: "sent" }];
