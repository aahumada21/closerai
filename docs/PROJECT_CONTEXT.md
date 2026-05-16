# Contexto del proyecto — Agentes y automatizaciones en n8n (Codex / GPT‑5.2)

## Qué es este proyecto
Este repo define una forma de trabajo para construir un sistema modular en n8n donde:
- **n8n orquesta**: recibe eventos, enruta, transforma, valida y ejecuta acciones.
- **La base de datos es la memoria/estado** (fuente de verdad).
- **El LLM decide de forma acotada** cuándo corresponde (no reemplaza reglas duras).
- **Reglas determinísticas** resuelven lo obvio y evitan llamadas al LLM.

El “agente” no es un único workflow: normalmente es un **conjunto de workflows** conectados por `Execute Workflow`, cada uno con una responsabilidad bien definida.

## Definiciones (lenguaje común)
- **Workflow**: flujo n8n con nodos, rutas y side-effects.
- **Módulo**: workflow pequeño con propósito único (ej.: `rules_engine`).
- **Agente**: composición de módulos que implementa un comportamiento end‑to‑end.
- **Skill**: patrón reutilizable (plantillas de nodos, validaciones, contratos, retries, idempotencia).
- **MCP n8n**: herramientas para crear/leer/editar/exportar/ejecutar workflows en tu instancia.

## Objetivo al usar Codex (GPT‑5.2)
Usar prompts para que Codex:
1. Diseñe workflows con contratos y patrones robustos.
2. Reuse skills existentes.
3. Aplique las reglas del repo (`RULE.md`).
4. Opere tu instancia de n8n mediante el MCP (cuando esté disponible).
5. Entregue exports versionables y documentación mínima.

## Arquitectura modular recomendada (AI Closer / sistemas similares)
Módulos típicos (ejemplo):
- `whatsapp_inbound_router`: recibe/valida/normaliza (sin LLM).
- `lead_loader`: upsert + carga estado/relaciones (sin responder).
- `rules_engine`: reglas duras; decide “rule_based” vs “send_to_llm”.
- `context_builder`: prepara contexto mínimo útil.
- `llm_decision`: decisión acotada; salida JSON estricta.
- `action_executor`: ejecuta side-effects; persiste; audita (no decide).

Si tu caso no es WhatsApp, igual aplica el patrón:
**router → loader → rules → context → decision → executor**.

## Contratos (obligatorio)
Cada módulo debe declarar:
- **Input**: ejemplo JSON (lo que recibe).
- **Output**: ejemplo JSON (lo que retorna).
- **Supuestos**: qué campos pueden venir nulos/ausentes.
- **Errores esperados**: qué falla y cómo se maneja.

Plantilla: `templates/contracts/contract_base.json`

## Idempotencia y side-effects
Todo side-effect (enviar mensaje, agendar cita, crear oferta, escribir DB) debe:
- Tener `idempotency_key` definido.
- Verificar ejecución previa en DB/audit antes de ejecutar.
- Registrar auditoría con `trace_id`/`correlation_id`.

## Uso del LLM (solo cuando corresponde)
Cuando un módulo use LLM:
- Entrada al LLM: **contexto mínimo + objetivo**.
- Salida del LLM: **JSON estricto** (sin texto extra).
- Validación: schema/guardrails antes de ejecutar.
- Nunca permitir que el LLM decida sin “reason codes” cuando aplique.

## Flujo de trabajo para construir automatizaciones “por prompt”
1. **Definir el objetivo** (qué automatiza, para quién, criterios de éxito).
2. **Elegir módulos** (crear o reusar) y sus contratos.
3. **Elegir skills** (reusar patrones del repo).
4. **Diseñar nodos** (rutas, errores, retries, timeouts).
5. **Diseñar persistencia** (tablas/eventos/audit).
6. **Implementar en n8n** vía MCP (sin exponer secretos).
7. **Validar** con payloads de prueba y casos borde.
8. **Versionar** exports en `workflows/exports/` + actualizar docs.

## Qué información falta (la aportarás después)
Para automatizar de punta a punta con tu instancia real:
- Los skills reales en `skills/n8n/` (nombres, inputs/outputs, ejemplos).
- La especificación del MCP en `mcp/n8n/` (tools, formatos, permisos).

## Recursos ya incorporados
- Skills (vendor): `skills/n8n/n8n-skills/`
- MCP (vendor): `mcp/n8n/n8n-mcp/`

## Inventario real de workflows (vía API)
Para obtener el mapa real de workflows existentes en tu instancia n8n:
- Config: `docs/N8N_API_SETUP.md`
- Sync/export: `scripts/n8n_sync_workflows.ps1`
- Taxonomía (tags/números): `docs/WORKFLOW_TAXONOMY.md`
- Resultado: `workflows/catalog/workflows.inventory.json` + exports en `workflows/exports/*`
