// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        build_success_html
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const data = $json || {};
const upstream = $("build_upsert_query").first().json;
const email = upstream.google_email || data.google_email || "";
const redirectUrl = "https://closer.aahumada.com/agents/" + (data.agent_id || "") + "?calendar_connected=1";

const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Calendario conectado</title></head>
<body style="font-family: sans-serif; text-align: center; margin-top: 80px;">
  <h2>Listo, tu Google Calendar quedo conectado</h2>
  <p>Cuenta conectada: ${email}</p>
  <p>Redirigiendo de vuelta al panel...</p>
  <script>setTimeout(function () { window.location.href = ${JSON.stringify(redirectUrl)}; }, 1500);</script>
</body>
</html>`;

return [{ json: { html_body: html } }];
