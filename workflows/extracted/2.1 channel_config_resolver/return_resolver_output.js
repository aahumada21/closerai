// === ARCHIVO GENERADO -- NO EDITAR ===
// Extraido de: 2.1 channel_config_resolver  (workflow id gYYvc3jTVgDnAB8K)
// Nodo:        return_resolver_output
//
// La fuente de verdad es el JSON del workflow en workflows/exports/.
// Editar este archivo no tiene ningun efecto. Regenerar con:
//   node scripts/extract_workflow_code.js
// =====================================

const resolverItems = $items('build_resolver_output', 0, 0);
const output = resolverItems?.[0]?.json || $json || {};
return [{ json: output }];
