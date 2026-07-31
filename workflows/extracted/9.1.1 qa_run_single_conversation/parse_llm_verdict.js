// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 9.1.1 qa_run_single_conversation  (workflow id 34092303-cb4a-4fd2-800e-ac16f650fc52)
// Nodo:        parse_llm_verdict
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $("build_llm_judge_prompt").first().json;
const response = $json || {};

function sqlText(value) {
  if (value === undefined || value === null) return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlJsonbArray(value) {
  const arr = Array.isArray(value) ? value : [];
  return "'" + JSON.stringify(arr).replace(/'/g, "''") + "'::jsonb";
}

let verdict = null;
try {
  const rawContent = response.choices?.[0]?.message?.content;
  verdict = JSON.parse(rawContent);
} catch (e) {
  verdict = null;
}

const llmPassed = verdict && typeof verdict.passed === "boolean" ? verdict.passed : false;
const inconsistencies = verdict && Array.isArray(verdict.inconsistencies) ? verdict.inconsistencies : [];
const problems = verdict && Array.isArray(verdict.problems) ? verdict.problems : [];
const notes = verdict && typeof verdict.notes === "string"
  ? verdict.notes
  : "No se pudo interpretar la respuesta del evaluador OpenAI.";

const query = `
UPDATE public.qa_test_results
SET
  passed = ${llmPassed ? "true" : "false"},
  llm_passed = ${llmPassed ? "true" : "false"},
  llm_inconsistencies = ${sqlJsonbArray(inconsistencies)},
  llm_problems = ${sqlJsonbArray(problems)},
  llm_notes = ${sqlText(notes)},
  llm_raw_response = ${sqlText(JSON.stringify(response))}::jsonb
WHERE run_id = ${sqlText(ctx.run_id)}
  AND scenario_id = ${sqlText(ctx.scenario_id)}
RETURNING id, run_id, scenario_id, passed, llm_passed;
`;

return [{
  json: {
    run_id: ctx.run_id,
    scenario_id: ctx.scenario_id,
    update_query: query,
    llm_passed: llmPassed,
    inconsistencies,
    problems,
    notes
  }
}];
