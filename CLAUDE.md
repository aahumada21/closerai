## Reglas del repo (leer antes de tocar workflows)

- `RULE.md` (raíz) tiene las reglas no negociables de este repo: DB como fuente de
  verdad, IA acotada, idempotencia, observabilidad, y el estándar de entrega por
  workflow. `AGENTS.md` es el equivalente de este archivo para Codex y apunta a lo
  mismo — mantener ambos alineados si se cambian convenciones.
- `docs/PROJECT_CONTEXT.md` para el contexto del producto; `ARCHITECTURE.md` (raíz)
  para el mapa real del pipeline y sus gaps conocidos.
- **Encoding** (`RULE.md` §Encoding): en `parameters.jsCode` de los Code nodes,
  evitar caracteres no-ASCII en strings visibles (usar `manana`, `ningun`, `aca`),
  porque el ciclo export/import puede degradarlos a `U+FFFD` y romper reglas/QA.
- Al leer o escribir workflows por la API de n8n desde un script, acumular los
  chunks HTTP como `Buffer` y decodificar una sola vez (`Buffer.concat(chunks)
  .toString('utf8')`). Concatenar los chunks como string (`body += chunk`) parte
  los caracteres multi-byte que caen en el límite entre chunks y los convierte en
  `U+FFFD` de forma silenciosa y no determinista — y un `PUT` posterior deploya esa
  corrupción a producción.
- Antes de subir exports: `powershell -ExecutionPolicy Bypass -File scripts/check_workflow_exports.ps1`
  (falla si detecta `U+FFFD` o JSON inválido).
- Tras cambiar `3 rules_engine`: `node scripts/rules_engine_regression_harness.js`
  (corre el `jsCode` real, sin red ni DB; debe quedar en verde antes de desplegar).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
