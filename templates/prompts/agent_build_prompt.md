# Prompt base — Diseñar un “agente” (conjunto de workflows) en n8n

## Objetivo
Construye un agente que implemente: `<capability>`

## Restricciones del repo
- Sigue `RULE.md` (idempotencia, auditoría, IA acotada, separación de módulos).
- Reusa skills en `skills/n8n/` antes de crear patrones nuevos.
- Implementa/edita workflows usando el MCP documentado en `mcp/n8n/`.

## Especificación
### Canales/entradas
- Entrada principal: `<webhook|whatsapp|crm|...>`
- Eventos a soportar: `<event_types>`

### Estado y DB
- Fuente de verdad: `<db>`
- Tablas/colecciones: `<tables>`

### Salidas/side-effects
- Acciones: `<send_message|create_appointment|update_crm|...>`
- Reglas de idempotencia: `<key_strategy>`

## Entregables
1. Lista de módulos/workflows (con propósito + contratos).
2. Diseño de nodos por módulo (rutas y errores).
3. Reuso explícito de skills (nombre del skill + dónde se aplica).
4. Artefactos versionables:
   - exports en `workflows/exports/`
   - notas/cambios en `docs/`

