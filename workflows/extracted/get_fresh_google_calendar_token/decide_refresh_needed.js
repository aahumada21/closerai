// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_fresh_google_calendar_token  (workflow id J3IJloxxmbHiaJgf)
// Nodo:        decide_refresh_needed
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};

const connected = input.connected === true || input.connected === "t" || input.connected === "true";

if (!connected) {
  return [{ json: { connected: false, needs_refresh: false } }];
}

const expiresAt = input.access_token_expires_at ? new Date(input.access_token_expires_at).getTime() : 0;
const needsRefresh = !input.access_token || !expiresAt || expiresAt < (Date.now() + 60000);

return [{
  json: {
    connected: true,
    needs_refresh: needsRefresh,
    refresh_token: input.refresh_token,
    access_token: input.access_token,
    google_email: input.google_email,
    calendar_id: input.calendar_id
  }
}];
