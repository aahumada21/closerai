// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 6.3 create_calendar_booking  (workflow id a3ec1c2d-0a59-46b1-a404-7a990234f3dc)
// Nodo:        merge_calendar_auth_result
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const original = $("build_calendar_event_payload").first().json;
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


// --- Guard de aislamiento multi-tenant ---
// Si no hay calendario propio (config/staff) NI conexion OAuth del agente, no
// se agenda. Antes se caia a "primary", el calendario de la credencial
// compartida de n8n, que es de otro tenant. Fallar aca es deliberado: es
// preferible cortar y derivar a un humano antes que escribir o leer el
// calendario de otro cliente. Ver docs/arquitectura/AISLAMIENTO_CALENDARIO.md
const resolvedCalendarId =
  staffCalendarId || (auth.connected === true ? auth.calendar_id : null) || null;

if (!resolvedCalendarId) {
  throw new Error(
    'calendar_not_configured: el agente no tiene calendario propio ni conexion ' +
    'de Google Calendar. No se agenda para no usar el calendario de otro cliente. ' +
    'Configurar agent_business_config.config.calendar_id o conectar OAuth.'
  );
}

return [{
  json: {
    ...original,
    oauth_connected: auth.connected === true,
    oauth_access_token: auth.access_token || null,
    oauth_calendar_id: staffCalendarId || auth.calendar_id || null
  }
}];
