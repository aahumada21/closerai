// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        build_transcript_query
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $json || {};

function sqlText(value) {
  if (value === undefined || value === null || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const query = `
SELECT COALESCE(json_agg(t ORDER BY t.step_index), '[]'::json) AS transcript
FROM (
  SELECT step_index, text_sent, bot_response, passed, errors
  FROM public.qa_test_results
  WHERE run_id = ${sqlText(ctx.run_id)}
    AND scenario_id = ${sqlText(ctx.scenario_id)}
) t;
`;

return [{ json: { ...ctx, transcript_query: query } }];
