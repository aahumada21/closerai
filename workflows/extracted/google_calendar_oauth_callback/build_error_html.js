// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        build_error_html
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json || {};
const errorMessages = {
  google_oauth_denied: "Cancelaste la conexion con Google o no diste el permiso necesario.",
  missing_code: "Falta el codigo de autorizacion de Google.",
  invalid_state: "El enlace de conexion no es valido o expiro.",
  agent_not_found: "No se encontro el agente al que se quiere conectar el calendario."
};

const message = errorMessages[data.error] || "No se pudo conectar el calendario de Google.";

const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>No se pudo conectar</title></head>
<body style="font-family: sans-serif; text-align: center; margin-top: 80px;">
  <h2>No se pudo conectar tu Google Calendar</h2>
  <p>${message}</p>
  <p>Vuelve al panel e intenta de nuevo.</p>
</body>
</html>`;

return [{ json: { html_body: html } }];
