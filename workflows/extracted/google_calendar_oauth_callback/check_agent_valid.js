// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: google_calendar_oauth_callback  (workflow id ulUOTFazrMcE2BdJ)
// Nodo:        check_agent_valid
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const ctx = $("validate_oauth_callback").first().json;
const lookup = $json || {};

const agentValid = lookup.agent_valid === true || lookup.agent_valid === "t" || lookup.agent_valid === "true";

return [{
  json: {
    ...ctx,
    valid: ctx.valid && agentValid,
    error: !agentValid ? "agent_not_found" : ctx.error
  }
}];
