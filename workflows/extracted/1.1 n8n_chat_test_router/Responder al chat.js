// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 1.1 n8n_chat_test_router  (workflow id 0b02fa7c-8ba2-4a4d-a6e3-87a3165020eb)
// Nodo:        Responder al chat
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const row = $json;

const message =
  row.content ||
  row.message ||
  row.output ||
  null;

if (!message) {
  return [
    {
      json: {
        output: "No encontr una respuesta generada por el bot. Revisa si el action_executor lleg a enviar/guardar el mensaje outbound."
      }
    }
  ];
}

return [
  {
    json: {
      output: message
    }
  }
];
