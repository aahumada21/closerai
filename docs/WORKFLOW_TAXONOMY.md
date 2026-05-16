# Taxonomía de workflows (Tags + numeración)

## Objetivo
Estandarizar cómo identificamos y ordenamos workflows en n8n para que Codex (GPT‑5.2) pueda:
- Descubrir rápido “qué existe”.
- Clasificar flujos por rol (principal/secundario/herramienta/QA).
- Exportar/guardar workflows en este repo con una estructura consistente.

## Tags (regla de negocio del proyecto)
Según tu convención:
- `Closer`: workflow parte del sistema AI Closer.
- `Main`: workflow principal (pipeline end‑to‑end o módulos troncales).
- `TOOL`: workflow utilitario (helpers compartidos).
- `QA`: workflow de pruebas.

Interpretación:
- `Closer` + `Main` ⇒ **principal** (módulo/pipeline troncal).
- Solo `Closer` ⇒ **secundario** (sub-módulo del Closer).
- `Main` sin `Closer` ⇒ **principal genérico** (no necesariamente Closer).
- `TOOL` ⇒ herramienta (puede ser usada por Closer/Main).
- `QA` ⇒ pruebas QA.

## Numeración (orden dentro del sistema)
- Prefijo `1`, `2`, `3`, ... define el **flujo principal**.
- Sub‑flujos:
  - `6.1` ⇒ sub‑flujo 1 del flujo principal `6`
  - `6.2` ⇒ sub‑flujo 2 del flujo principal `6`
  - etc.

## Estructura en el repo
Exports (JSON) se guardan en:
- `workflows/exports/uncategorized/` (única carpeta usada por el sync; no depende de tags)

Inventario/catálogo:
- `workflows/catalog/workflows.inventory.json` (lista completa + metadatos)

## Refactor: `action_executor` a sub-workflows
Para mantener `6 action_executor` liviano, cada rama del `action_router` puede moverse a sub-workflows pequeños.

Plantillas (generadas desde el export actual):
- Generar: `powershell -ExecutionPolicy Bypass -File scripts/generate_action_executor_subworkflows.ps1`
- Salida: `workflows/modules/action_executor/*.template.json`

Crear en n8n (por API) desde una plantilla:
- `powershell -ExecutionPolicy Bypass -File scripts/n8n_create_workflow_from_template.ps1 -TemplatePath "<path>" -Category uncategorized`
