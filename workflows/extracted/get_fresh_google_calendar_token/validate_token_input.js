// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: get_fresh_google_calendar_token  (workflow id J3IJloxxmbHiaJgf)
// Nodo:        validate_token_input
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const input = $json || {};
const agentId = String(input.agent_id || "").trim();

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

if (!isUuid) {
  // Sin agent_id valido no hay nada que buscar: no lanzamos error para no
  // romper el flujo de booking de leads viejos sin agent_id asignado todavia
  // (445 leads historicos no tienen agent_id). Simplemente no hay conexion.
  return [{
    json: {
      agent_id: null,
      lookup_query: "SELECT false AS connected, NULL AS google_email, NULL AS refresh_token, NULL AS access_token, NULL::timestamptz AS access_token_expires_at, NULL AS calendar_id;"
    }
  }];
}

return [{
  json: {
    agent_id: agentId,
    lookup_query: `
SELECT
  EXISTS(SELECT 1 FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS connected,
  (SELECT google_email FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS google_email,
  (SELECT refresh_token FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS refresh_token,
  (SELECT access_token FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS access_token,
  (SELECT access_token_expires_at FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS access_token_expires_at,
  (SELECT calendar_id FROM public.google_calendar_connections WHERE agent_id = '${agentId}'::uuid) AS calendar_id;
`
  }
}];
