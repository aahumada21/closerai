// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.2 check_calendar_slot  (workflow id 9b16489e-ce39-4213-ab5d-270d035fa1e0)
// Nodo:        merge_calendar_auth_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("build_slot_range").first().json;
const auth = $json || {};

// Si la seleccion de personal asigno un calendario propio a esa persona
// (agent_staff.calendar_id), ese manda por sobre el calendario por defecto
// del agente que devuelve get_valid_calendar_token. Cuando el negocio opera
// con un solo calendario compartido este campo llega vacio o como "primary"
// y se sigue usando el del agente, igual que siempre.
const staffCalendarId =
  original.calendar_id && original.calendar_id !== "primary"
    ? original.calendar_id
    : null;

return [{
  json: {
    ...original,
    oauth_connected: auth.connected === true,
    oauth_access_token: auth.access_token || null,
    oauth_calendar_id: staffCalendarId || auth.calendar_id || null
  }
}];
