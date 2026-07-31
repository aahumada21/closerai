# Auditoría de arquitectura AI Agents

Fecha: 2026-06-07  
Repositorio auditado: exports locales n8n, scripts, SQL, schemas, documentación y QA.

## Resumen ejecutivo

Estado actual: **1 = closer modular para un negocio**.

El proyecto tiene una arquitectura modular sólida para un AI Closer comercial, con separación de responsabilidades, QA, auditoría e idempotencia. Sin embargo, todavía no implementa una capa completa de AI Agents multiempresa/multiagente.

Actualmente el core sigue estando orientado a **Ahumada Detailing** y contiene reglas, acciones, prompts, servicios, comunas y flujos comerciales hardcodeados.

Existe una base inicial para multi-número WhatsApp mediante `whatsapp_numbers`, pero eso no equivale todavía a multiempresa/multiagente.

## 1. Existencia de capa AI Agent

No se encontró una capa activa equivalente a:

- `ai_agents`
- `agents`
- `assistants`
- `agent_config`
- `organization_agents`

### Hallazgos

| Elemento | Estado | Evidencia |
|---|---:|---|
| `agents` / `ai_agents` | No implementado | No aparece como tabla ni workflow activo |
| `organization_id` | Solo propuesto | Aparece en documentos de análisis, no en workflows activos |
| `default_agent` | Parcial | Existe como `text` en `whatsapp_numbers`, pero no referencia una tabla `agents` |
| `business_config` / `agent_config` | No implementado | El contexto se arma desde estado fijo y reglas en código |

Referencias:

- `db/migrations/20260602_meta_whatsapp_multi_number.sql:4`
- `db/migrations/20260602_meta_whatsapp_multi_number.sql:12`
- `Contexto/Completados/action_executor_faltantes_producto_comercial.md:529`

Conclusión: existe una **señal inicial de routing por agente** (`default_agent`), pero no hay entidad, configuración, personalidad ni tools por agente.

## 2. Flujo actual de un mensaje entrante

Arquitectura esperada/documentada:

```text
WhatsApp
→ inbound_router
→ lead_loader
→ rules_engine
→ context_builder
→ llm_decision
→ action_executor
```

Referencia arquitectónica:

- `docs/PROJECT_CONTEXT.md:27`
- `docs/PROJECT_CONTEXT.md:29`
- `docs/PROJECT_CONTEXT.md:30`
- `docs/PROJECT_CONTEXT.md:31`
- `docs/PROJECT_CONTEXT.md:32`
- `docs/PROJECT_CONTEXT.md:33`
- `docs/PROJECT_CONTEXT.md:34`

### 2.1 WhatsApp → inbound_router

Workflow:

- `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json`

Qué hace:

- Recibe payload de WhatsApp Cloud API.
- Ignora eventos de status.
- Extrae el primer mensaje entrante.
- Normaliza `channel`, `lead_id`, `message_id`, `timestamp`, `message_type`, `text`, `attachments`, `contact`, `source_metadata`.
- Filtra por un `phone_number_id` configurado en un nodo Set.

Datos agregados:

- `source_metadata.provider`
- `source_metadata.phone_number_id`
- `source_metadata.display_phone_number`

Observación:

- El filtro de número está hardcodeado en el workflow, no resuelto desde `whatsapp_numbers`.

Referencia:

- `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json:100`

### 2.2 inbound_router → lead_loader

Workflow:

- `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json`

Qué hace:

- Valida `channel`, `lead_id`, `timestamp`.
- Usa `lead_id` como `external_id`.
- Hace upsert en `leads`.
- Hace upsert/lectura de `lead_state`.
- Devuelve `event`, `lead`, `lead_state`, `meta`.

Tablas:

- `leads`
- `lead_state`

Campos principales cargados:

- `stage`
- `intent_last`
- `service_interest`
- `vehicle_type`
- `district`
- `missing_fields`
- `last_bot_action`
- `next_goal`
- `human_handoff`
- `booking_options`
- `booking_date`
- `booking_time`
- `slot_id`
- `availability_confirmed`
- `calendar_id`
- `service_address`
- `address_confirmed`
- `cancellation_reason`
- `reschedule_reason`

Referencia:

- `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:52`

### 2.3 lead_loader → rules_engine

Workflow:

- `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json`

Qué hace:

- Normaliza `event`, `lead`, `lead_state`, `memory`, `business_rules`.
- Evalúa reglas duras.
- Decide si:
  - detener,
  - ejecutar acción directa,
  - construir contexto para LLM,
  - llamar `action_executor`.

Observación:

- Las reglas están escritas en código JS.
- No vienen desde una tabla de configuración por agente.

Referencia:

- `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json:25`

### 2.4 rules_engine → context_builder

Workflow:

- `workflows/exports/uncategorized/4 - 4 context_builder__id-5f5ef274-4b7a-4a1a-b463-ff22e5eae55e.json`

Qué hace:

- Construye `context_packet`.
- Calcula `allowed_actions`.
- Calcula hints de estado comercial.
- Rehidrata datos desde `lead_state`, `rule_result`, `memory`, `business_rules`.

Campos enviados al modelo:

```json
{
  "lead": {},
  "state": {},
  "conversation": {},
  "source_metadata": {},
  "business": {},
  "rule_context": {},
  "context_hints": {},
  "commercial_memory": {},
  "allowed_actions": []
}
```

No construye:

```json
{
  "agent": {},
  "organization": {},
  "tools": [],
  "agent_config": {}
}
```

Referencia:

- `workflows/exports/uncategorized/4 - 4 context_builder__id-5f5ef274-4b7a-4a1a-b463-ff22e5eae55e.json:26`

### 2.5 context_builder → llm_decision

Workflow:

- `workflows/exports/uncategorized/5 - 5 llm_decision__id-8e8b11be-4a3d-4804-80ec-30582eeb5384.json`

Qué hace:

- Valida `context_packet`.
- Construye prompt fijo de decisión.
- Llama al LLM.
- Parsea JSON.
- Valida schema.
- Guarda auditoría.
- Devuelve decisión estructurada.

Observación:

- El prompt es fijo.
- No hay personalidad, tono, límites o política por agente.
- No hay prompt template por organización.

Referencia:

- `workflows/exports/uncategorized/5 - 5 llm_decision__id-8e8b11be-4a3d-4804-80ec-30582eeb5384.json:572`

### 2.6 llm_decision/rules_engine → action_executor

Workflow:

- `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json`

Qué hace:

- Valida acción.
- Revisa idempotencia.
- Enruta por `action_router`.
- Ejecuta subworkflow específico.
- Persiste resultado.
- Guarda auditoría.

Observación:

- Es un router de acciones hardcodeadas.
- No es aún un sistema genérico `tool_name → executor`.

Referencia:

- `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:6657`

## 3. Verificación de lead_loader

`lead_loader` no carga actualmente:

- `agent_id`
- `organization_id`
- `agent_config`
- `business_config`
- tools disponibles
- acciones permitidas por agente
- personalidad del agente

Carga principalmente:

- lead
- estado comercial
- booking/address/cancel/reschedule state

Conclusión: el contexto depende del estado del lead y de reglas fijas, no de un agente dinámico.

## 4. Análisis de context_builder

`context_builder` construye una estructura cercana a:

```json
{
  "lead": {},
  "state": {},
  "conversation": {},
  "business": {},
  "rule_context": {},
  "context_hints": {},
  "commercial_memory": {},
  "allowed_actions": []
}
```

Pero no construye:

```json
{
  "agent": {},
  "business": {},
  "state": {},
  "allowed_actions": []
}
```

Problema central:

- `business` existe, pero no viene de una entidad multiempresa/multiagente.
- `allowed_actions` se calcula desde stages y reglas hardcodeadas.
- El contexto todavía representa el caso Ahumada Detailing.

## 5. Análisis de rules_engine

Las reglas están hardcodeadas en código JS.

Reglas hardcodeadas encontradas:

- campos requeridos por stage (`REQUIRED_FIELDS_BY_STAGE`)
- mensajes para pedir datos faltantes
- normalización de comunas
- normalización de vehículos
- detección de preguntas
- detección de intención de cotizar
- detección de servicio
- detección de agenda/disponibilidad
- detección de cancelar
- detección de reagendar
- selección de slot
- dirección pendiente
- handoff humano
- post servicio/review/referral
- stage machine comercial

Ejemplos de hardcoding:

- `service_interest`
- `district`
- `vehicle_type`
- `lavado_basico`
- `lavado_premium`
- `encerado_full`
- `Huechuraba`
- `Nunoa`
- mensajes comerciales en español

Referencia:

- `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json:25`

## 6. Análisis de action_executor

El executor actual no funciona como un registry genérico de tools.

No es:

```text
calendar.create → executor
crm.update → executor
message.send → executor
```

Es:

```text
action_name → rama/subworkflow hardcodeado
```

Acciones actuales:

- `ask_missing_data`
- `send_quote`
- `answer_question`
- `answer_objection`
- `offer_booking`
- `offer_available_slots`
- `confirm_booking`
- `schedule_followup`
- `handoff_human`
- `cancel_booking`
- `reschedule_booking`
- `collect_address`
- `confirm_address`
- `send_pre_service_instructions`
- `notify_on_the_way`
- `request_review`
- `request_referral`
- `send_service_menu`
- `recommend_service`

Referencia:

- `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:6657`

Ejemplo de negocio hardcodeado:

- menú “Ahumada Detailing”
- servicios `Lavado básico`, `Lavado premium`, `Encerado full`

Referencia:

- `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:6076`

## 7. Base de datos

### Tablas activas del closer actual

| Tabla | Propósito | Uso |
|---|---|---|
| `leads` | raíz de cliente/conversación | Usada |
| `lead_state` | memoria comercial/state machine | Usada |
| `messages` | mensajes inbound/outbound | Usada |
| `offers_or_quotes` | cotizaciones | Usada |
| `appointments` | reservas | Usada |
| `followups` | automatizaciones comerciales | Usada |
| `audit_logs` | trazabilidad | Usada |
| `qa_test_scenarios_temp` | QA temporal | Usada |
| `qa_test_results` | resultados QA | Usada |

Referencias:

- `Contexto/db_schema_ordenado_ai_closer.md:15`
- `Contexto/db_schema_ordenado_ai_closer.md:93`
- `Contexto/db_schema_ordenado_ai_closer.md:261`
- `Contexto/db_schema_ordenado_ai_closer.md:311`
- `Contexto/db_schema_ordenado_ai_closer.md:408`
- `Contexto/db_schema_ordenado_ai_closer.md:499`

### Tablas multi-número Meta

| Tabla | Propósito | Uso |
|---|---|---|
| `whatsapp_numbers` | configurar números Meta Cloud API | Parcialmente usada |
| `whatsapp_webhook_logs` | logs normalizados de webhook Meta | Usada por workflow Meta |

Referencias:

- `db/migrations/20260602_meta_whatsapp_multi_number.sql:4`
- `db/migrations/20260602_meta_whatsapp_multi_number.sql:23`

### Tablas esperadas para AI Agents SaaS

| Tabla | Estado |
|---|---|
| `organizations` | No implementada |
| `agents` / `ai_agents` | No implementada |
| `organization_agents` | No implementada |
| `business_rules` | No implementada como config activa |
| `knowledge_base` | No implementada |
| `agent_tools` | No implementada |

## 8. Resultado final

### Nota

**1 / 3 — closer modular para un negocio.**

Escala:

- `0`: chatbot hardcodeado
- `1`: closer modular para un negocio
- `2`: preparado parcialmente para agents
- `3`: arquitectura completa AI Agents SaaS

Justificación:

- Está bien modularizado.
- Tiene workflows separados por responsabilidad.
- Tiene QA y auditoría.
- Tiene idempotencia.
- Tiene multi-número parcial en Meta.
- Pero no tiene tenant model.
- No tiene agentes configurables.
- No tiene tools dinámicas.
- No tiene knowledge base por agente.
- No tiene business rules dinámicas por agente.
- No tiene prompts/personas por agente.

## Qué NO tocar

No tocar todavía:

- La secuencia modular `router → lead_loader → rules → context → llm → executor`.
- Los scripts QA existentes.
- `qa_test_results` y `qa_test_scenarios_temp`.
- Auditoría e idempotencia del `action_executor`.
- La capa `whatsapp_webhook_meta` multi-número.
- Los subworkflows críticos de booking/cancel/reschedule sin QA específico.

## Qué modificar primero

Orden recomendado:

1. Crear modelo de datos multiempresa/multiagente.
2. Conectar `whatsapp_numbers.default_agent` con `agents.id`.
3. Hacer que `lead_loader` resuelva `agent_id` y `organization_id`.
4. Hacer que `context_builder` incluya `agent`, `organization`, `business`, `tools`.
5. Extraer reglas de negocio desde `rules_engine` hacia config por agente.
6. Convertir `action_executor` en dispatcher híbrido: acciones actuales + tools genéricas.

## Cambios riesgosos

Riesgos altos:

- Cambiar `rules_engine` puede romper gran parte del QA actual.
- Cambiar `action_executor` puede romper booking, cancelación y reagendamiento.
- Cambiar `lead_state` puede romper continuidad conversacional.
- Cambiar prompts del LLM puede alterar respuestas y pasar/fallar QA por semántica.
- Mover precios/servicios a config sin fallback puede romper cotización.

## Plan de migración recomendado

### Fase 1 — Agregar modelo sin romper runtime

Crear tablas nuevas:

- `organizations`
- `agents`
- `agent_channels`
- `agent_business_config`
- `agent_rules`
- `agent_tools`
- `agent_knowledge_sources`

No reemplazar aún los workflows actuales.

### Fase 2 — Registrar agente actual

Crear un agente:

```text
organization: ahumada_detailing
agent: ahumada_detailing_closer
```

Copiar a config lo que hoy está hardcodeado:

- servicios
- comunas
- pricing policy
- booking policy
- acciones permitidas
- personalidad
- mensajes base

### Fase 3 — Resolver agente por número

Actualizar `whatsapp_numbers.default_agent` para apuntar a `agents.id`.

Modificar entrada:

```text
phone_number_id → whatsapp_numbers → default_agent → agent_config
```

### Fase 4 — Context builder híbrido

Agregar al `context_packet`:

```json
{
  "organization": {},
  "agent": {},
  "business": {},
  "tools": [],
  "state": {},
  "allowed_actions": []
}
```

Mantener fallback actual si no existe config.

### Fase 5 — Rules engine híbrido

Extraer primero:

- `required_fields`
- servicios disponibles
- comunas soportadas
- mensajes de datos faltantes
- stages permitidos
- allowed actions por stage

Mantener reglas críticas hardcodeadas temporalmente:

- idempotencia
- handoff lock
- no confirmar sin dirección
- no inventar horarios
- no inventar precios

### Fase 6 — Tool registry

Crear registry:

```text
tool_name
executor_workflow_id
required_fields
side_effect_level
idempotency_strategy
audit_policy
```

Migrar gradualmente:

- `message.send`
- `calendar.availability`
- `calendar.create`
- `calendar.cancel`
- `calendar.reschedule`
- `crm.update_lead_state`
- `quote.create`

### Fase 7 — QA por capas

Antes de activar multiempresa:

- QA agente actual debe seguir pasando.
- QA con config faltante debe fallback seguro.
- QA con número no configurado debe no procesar.
- QA con agente inactivo debe responder/derivar seguro.
- QA multi-número debe enrutar distinto por `phone_number_id`.

## Conclusión

El sistema actual no es un AI Agents SaaS completo. Es una base razonablemente madura de AI Closer modular para un negocio, con una capa de WhatsApp multi-número parcial. La migración correcta no debe reescribir todo: debe introducir primero `organization` y `agent` como capa de configuración alrededor del flujo actual, y luego mover reglas/tools de forma gradual con QA en cada extracción.
