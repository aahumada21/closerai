// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: disconnect_google_calendar  (workflow id 2FtwTlOI0mzbrXqR)
// Nodo:        build_disconnect_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $("interpret_lookup_result").first().json;

function sqlUuid(value) {
  const text = String(value || "").trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text);
  if (!isUuid) throw new Error("Invalid uuid before disconnect query: " + text);
  return "'" + text + "'::uuid";
}

const query = `
WITH deleted_conn AS (
  DELETE FROM public.google_calendar_connections
  WHERE agent_id = ${sqlUuid(ctx.agent_id)}
  RETURNING agent_id
),
upd_agent AS (
  UPDATE public.agents
  SET google_calendar_connected = false,
      google_calendar_email = NULL
  WHERE id = ${sqlUuid(ctx.agent_id)}
  RETURNING id
)
SELECT (SELECT agent_id FROM deleted_conn) AS agent_id, (SELECT id FROM upd_agent) AS updated_agent_id;
`;

return [{ json: { ...ctx, disconnect_query: query } }];
