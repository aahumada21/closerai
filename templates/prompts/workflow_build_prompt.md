# Prompt base — Construcción de workflow (para usar con skills + MCP)

## Objetivo
Construye o modifica el workflow: `<workflow_name>`

## Contexto
- Módulo: `<module>`
- Fuente de verdad: DB
- Side-effects: `<whatsapp|calendar|crm|...>`

## Contrato
### Input (ejemplo)
```json
{}
```

### Output (ejemplo)
```json
{}
```

## Reglas
- No llamar LLM si reglas determinísticas resuelven.
- Idempotencia obligatoria en side-effects.
- Auditoría obligatoria en acciones críticas.

## Tareas
1) Diseña nodos y rutas (incluye errores).
2) Implementa en n8n usando el MCP (sin exponer secretos).
3) Exporta/entrega el artefacto (JSON o ID) y notas de cambio.

