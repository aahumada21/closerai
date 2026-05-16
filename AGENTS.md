# Instrucciones para Codex (GPT‑5.2) en este repo

## Objetivo del repo
Este repositorio está configurado para **crear agentes de IA y automatizaciones en n8n usando prompts**, apoyándose en:
- `skills/n8n/`: patrones reutilizables (“skills”) para construir workflows.
- `mcp/n8n/`: especificación del MCP/herramientas para operar contra la instancia de n8n.
- `workflows/`: exports y módulos versionables.
- `RULE.md`: reglas no negociables (idempotencia, observabilidad, IA acotada, etc.).

Instalado en este repo:
- `skills/n8n/n8n-skills/` (vendor de `czlonkowski/n8n-skills`)
- `mcp/n8n/n8n-mcp/` (vendor de `czlonkowski/n8n-mcp`)

## Cómo trabajar (orden recomendado)
1. Leer `RULE.md` (raíz) y `docs/PROJECT_CONTEXT.md`.
   - MCP en modo full: `docs/MCP_FULL_CONFIGURATION.md`.
   - Sync de workflows (API n8n): `docs/N8N_API_SETUP.md`.
   - Si falta información actualizada de workflows, pedir al usuario ejecutar: `powershell -ExecutionPolicy Bypass -File scripts/n8n_sync_workflows.ps1`
2. Reusar skills existentes en `skills/n8n/` antes de inventar patrones nuevos.
3. Diseñar workflow con contrato claro (input/output), side-effects, idempotencia y auditoría.
4. Implementar usando el MCP documentado en `mcp/n8n/` (sin exponer secretos).
5. Entregar artefactos versionables en `workflows/exports/` y notas en `docs/`.

## Convenciones rápidas
- Workflows en `snake_case` y por responsabilidad (evitar “mega workflows”).
- Side-effects (WhatsApp, calendar, DB writes) siempre con idempotencia + auditoría.
- El LLM **no** ejecuta; decide con salida JSON estricta y validada.

## Qué entregar en cada cambio
- Archivo(s) actualizados en `workflows/` + contrato y checklist aplicados.
- Cambios reflejados (si aplica) en `docs/` y/o `RULE.md`.
