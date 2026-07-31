// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.4 list_available_slots  (workflow id 1e882e96-85ef-4afa-8619-8a7bf5f52376)
// Nodo:        merge_calendar_auth_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("generate_candidate_slots").first().json;
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
