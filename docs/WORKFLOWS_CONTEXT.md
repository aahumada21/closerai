# Contexto de workflows (AI Closer / n8n)

## Pipeline base (según documentación existente)
Estos son los módulos descritos en `Contexto/` como arquitectura modular del AI Closer:

1. `whatsapp_inbound_router`
2. `lead_loader`
3. `rules_engine`
4. `context_builder`
5. `llm_decision`
6. `action_executor`
7. `followup_scheduler`
8. `human_handoff`
9. `analytics_audit`

Notas operativas:
- `whatsapp_inbound_router`: valida/normaliza; sin IA; sin lógica comercial.
- `lead_loader`: upsert + carga estado/memoria; DB es fuente de verdad.
- `rules_engine`: reglas duras; decide si se resuelve sin LLM o pasa a IA.
- `context_builder`: arma `context_packet` mínimo y útil; no llama LLM.
- `llm_decision`: decide **una** acción permitida + mensaje + `state_update` (JSON estricto).
- `action_executor`: no decide; ejecuta side-effects; persiste; audita; idempotencia.

## Fuente de verdad del repo
Para operar con Codex:
- Reglas: `RULE.md`
- Guía Codex: `AGENTS.md`
- Contexto general: `docs/PROJECT_CONTEXT.md`
- Taxonomía: `docs/WORKFLOW_TAXONOMY.md`

## Pendiente de sincronizar desde n8n
Este repo va a sincronizar los workflows reales desde tu instancia vía API y generar:
- Inventario: `workflows/catalog/workflows.inventory.json`
- Exports en `workflows/exports/uncategorized/`

## Contexto LIVE (desde inventory)
Cuando exista `workflows/catalog/workflows.inventory.json`, genera un contexto “live” (listado agrupado por tags/categoría) con:
- `powershell -ExecutionPolicy Bypass -File scripts/generate_workflows_context.ps1`

Salida:
- `docs/WORKFLOWS_CONTEXT_LIVE.md`
