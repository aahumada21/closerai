# Auditoria actualizada de arquitectura AI Agents

Fecha: 2026-06-15  
Base comparada: `docs/AI_AGENTS_ARCHITECTURE_AUDIT_2026-06-07.md`  
Repositorio auditado: exports locales n8n, migraciones SQL, scripts QA, documentacion y resultados QA recientes.

## Resumen ejecutivo

Estado actual: **2 = preparado parcialmente para AI Agents multiempresa/multiagente**.

El sistema ya no esta en el estado descrito el 2026-06-07. Desde esa auditoria se agrego una capa real de configuracion multiempresa/multiagente:

- tablas `organizations`, `agents`, `agent_channels`, `agent_business_config`, `agent_rules`, `agent_tools`, `agent_prompt_templates`, `agent_runtime_versions`, `agent_knowledge_sources` y `agent_knowledge_chunks`;
- `lead_loader` ahora persiste y devuelve `organization_id` y `agent_id`;
- `lead_loader` carga `organization`, `agent`, `agent_business_config`, `agent_rules` y `agent_tools`;
- `context_builder` arma contexto agent-aware con `organization`, `agent`, `business`, `tools` y `knowledge`;
- `llm_decision` carga prompts desde `agent_prompt_templates`;
- `action_executor` tiene tool registry hibrido y audita `tool_name`, `agent_id` y `organization_id`;
- QA multiagente y PRD QA recientes validan auditoria, routing y tools para escenarios positivos.

La arquitectura todavia no es un SaaS AI Agents completo. El runtime productivo sigue teniendo partes legacy: el `1 Inbound_router` filtra por numero permitido con un nodo Set, el resolver por `agent_channels` esta implementado claramente en `9.0 qa_whatsapp_normalized_router` para QA, y `rules_engine`/`action_executor` siguen siendo hibridos con bastante logica hardcodeada de Ahumada Detailing.

## 1. Existencia de capa AI Agent

### Estado actual

La capa AI Agent existe como modelo de datos y ya esta parcialmente integrada al runtime.

| Elemento | Estado actual | Evidencia |
|---|---:|---|
| `organizations` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:4` |
| `agents` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:16` |
| `agent_channels` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:36` |
| `agent_business_config` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:57` |
| `agent_rules` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:72` |
| `agent_tools` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:89` |
| `agent_knowledge_sources` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:110` |
| `agent_knowledge_chunks` | Implementado | `db/migrations/20260608_ai_agents_knowledge_base_v1.sql:4` |
| `agent_prompt_templates` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:130` |
| `agent_runtime_versions` | Implementado | `db/migrations/20260607_ai_agents_foundation.sql:149` |

### Uso real

No son solo tablas creadas:

- `2 lead_loader` usa `organization_id` y `agent_id` en `leads` y `lead_state`.
- `2 lead_loader` carga configuracion del agente desde `agents`, `organizations`, `agent_business_config`, `agent_rules` y `agent_tools`.
- `4 context_builder` consume `agent_business_config`, `agent_tools` y knowledge.
- `5 llm_decision` consume `agent_prompt_templates`.
- `6 action_executor` resuelve `tool_registry` y audita `tool_name`.

Conclusión: la capa existe y esta en uso parcial. Lo que falta es terminar de mover el ingreso productivo y las reglas de negocio hacia configuracion dinamica.

## 2. Flujo actual de un mensaje entrante

Arquitectura efectiva:

```text
WhatsApp Cloud API
→ 1 Inbound_router / 9.0 qa_whatsapp_normalized_router
→ 2 lead_loader
→ 3 rules_engine
→ 4 context_builder
→ 5 llm_decision
→ 6 action_executor
→ subworkflows 6.x
→ 6.24 persist_and_audit
```

### 2.1 WhatsApp → router

#### Produccion: `1 Inbound_router`

Archivo:

- `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json`

Responsabilidades actuales:

- normaliza mensajes entrantes de WhatsApp Cloud API;
- normaliza eventos `status` (`sent`, `delivered`, `read`, `failed`);
- registra eventos status en `whatsapp_webhook_logs`;
- soporta mensajes `text`, `image`, `document`, `audio`, `video`, `location`, `interactive`;
- filtra por `allowed_phone_number_id`.

Limitacion:

- el filtro de numero sigue configurado en el workflow, no resuelve aun `agent_channels` en el flujo productivo.
- el proveedor normalizado aparece como `whatsapp_cloud_api` en algunos caminos, mientras QA usa `meta_whatsapp_cloud_api`; esto debe mantenerse consistente.

Referencias:

- normalizacion de mensajes/status: `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json:28`
- filtro por numero: `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json:99`
- log status: `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json:169`

#### QA / agent-aware: `9.0 qa_whatsapp_normalized_router`

Archivo:

- `workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json`

Responsabilidades actuales:

- toma `phone_number_id` desde `source_metadata`/`routing`;
- resuelve `agent_channels.external_channel_id`;
- valida `agent.is_active` y `organization.is_active`;
- devuelve `organization`, `agent`, `channel_config`, `routing`, `should_process` y `not_processed_reason`.

Referencia:

- resolver por `agent_channels`: `workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json:104`
- attach de contexto al payload: `workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json:124`

### 2.2 Router → `2 lead_loader`

Archivo:

- `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json`

Responsabilidades actuales:

- valida `channel`, `lead_id`, `timestamp`;
- recibe `routing.organization_id` y `routing.agent_id`;
- hace upsert en `leads` con `organization_id` y `agent_id`;
- hace upsert en `lead_state` con `organization_id` y `agent_id`;
- carga configuracion del agente;
- retorna `event`, `lead`, `lead_state`, `organization`, `agent`, `agent_business_config`, `agent_rules`, `agent_tools`, `routing`.

Tablas consultadas/escritas:

- `leads`
- `lead_state`
- `organizations`
- `agents`
- `agent_business_config`
- `agent_rules`
- `agent_tools`

Cambios relevantes frente al audit 2026-06-07:

- ya existen columnas `organization_id` y `agent_id` en `leads` y `lead_state`;
- se corrigio el problema de placeholders `$5/$6` en `db_upsert_lead`, reemplazandolo por interpolacion sanitizada en el export.

Referencias:

- columnas nuevas: `db/migrations/20260607_ai_agents_lead_loader_extension.sql:4`
- columnas en `lead_state`: `db/migrations/20260607_ai_agents_lead_loader_extension.sql:8`
- preparacion agent-aware: `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:25`
- retorno con config de agente: `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:38`
- upsert `lead_state`: `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:52`
- upsert `leads`: `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:73`
- carga de config del agente: `workflows/exports/uncategorized/2 - 2 lead_loader__id-f5383ae7-dd2e-4177-9875-c6dcff27e3d5.json:122`

### 2.3 `lead_loader` → `3 rules_engine`

Archivo:

- `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json`

Responsabilidades actuales:

- normaliza `event`, `lead`, `lead_state`, `memory`, `business_rules`, `organization`, `agent`, `agent_business_config`, `agent_rules`, `agent_tools`;
- evalua reglas deterministicas;
- decide ruta `rule_based` o `send_to_llm`;
- puede enviar directo a `action_executor` si una regla resuelve.

Estado agent-aware:

- carga `agent_rules`;
- usa regla configurable `lead_required_fields`;
- mantiene fallback legacy para required fields y mensajes;
- sigue teniendo muchas reglas comerciales hardcodeadas.

Referencias:

- normalizacion agent-aware: `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json:12`
- uso de `agent_rules`: `workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json:25`
- config `lead_required_fields`: `db/migrations/20260607_ai_agents_rules_engine_config_v1.sql:1`

### 2.4 `rules_engine` → `4 context_builder`

Archivo:

- `workflows/exports/uncategorized/4 - 4 context_builder__id-5f5ef274-4b7a-4a1a-b463-ff22e5eae55e.json`

Responsabilidades actuales:

- construye `context_packet`;
- agrega `organization`, `agent`, `agent_business_config`, `business`, `tools`, `knowledge`, `agent_rules`, `channel_config`, `routing`;
- arma `allowed_actions` con filtros por stage, datos disponibles, handoff, booking, address y appointment activo;
- carga knowledge desde `agent_knowledge_chunks`.

Campos clave enviados al LLM:

```json
{
  "lead": {},
  "state": {},
  "organization": {},
  "agent": {},
  "agent_business_config": {},
  "business": {},
  "tools": [],
  "knowledge": {
    "chunks": [],
    "source_ids": [],
    "retrieval_ok": true
  },
  "agent_rules": [],
  "channel_config": {},
  "routing": {},
  "conversation": {},
  "source_metadata": {},
  "rule_context": {},
  "context_hints": {},
  "commercial_memory": {},
  "allowed_actions": []
}
```

Estado:

- esta etapa ya es agent-aware;
- `business` prioriza `agent_business_config.config`;
- mantiene fallback a `business_rules`.

Referencias:

- build context agent-aware: `workflows/exports/uncategorized/4 - 4 context_builder__id-5f5ef274-4b7a-4a1a-b463-ff22e5eae55e.json:26`
- knowledge table: `db/migrations/20260608_ai_agents_knowledge_base_v1.sql:4`

### 2.5 `context_builder` → `5 llm_decision`

Archivo:

- `workflows/exports/uncategorized/5 - 5 llm_decision__id-8e8b11be-4a3d-4804-80ec-30582eeb5384.json`

Responsabilidades actuales:

- carga templates activos desde `agent_prompt_templates`;
- construye prompt dinamico con `organization`, `agent`, `business`, `knowledge`, `tools` y `allowed_actions`;
- valida salida JSON estricta;
- mantiene fallback legacy si no hay templates;
- guarda auditoria de decision LLM.

Estado:

- el prompt ya no es exclusivamente fijo;
- el modelo sigue con guardrails deterministas y schema estricto.

Referencias:

- prepare prompt dinamico: `workflows/exports/uncategorized/5 - 5 llm_decision__id-8e8b11be-4a3d-4804-80ec-30582eeb5384.json:25`
- carga templates: `workflows/exports/uncategorized/5 - 5 llm_decision__id-8e8b11be-4a3d-4804-80ec-30582eeb5384.json:240`
- seed prompt templates: `db/migrations/20260607_ai_agents_prompt_templates_v1.sql:1`

### 2.6 `llm_decision` / `rules_engine` → `6 action_executor`

Archivo:

- `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json`

Responsabilidades actuales:

- valida input y decision;
- resuelve idempotencia;
- valida requisitos por accion/tool;
- enruta a subworkflow `6.x`;
- persiste estado/mensajes;
- audita con `tool_name`, `executor_ref`, `agent_id`, `organization_id`;
- usa `message.send` como fallback observable para acciones conversacionales.

Estado:

- ya no es solo `action_name → rama hardcodeada`;
- ahora es `action_name → mapped_tool_names → tool_registry` con fallback legacy;
- aun conserva `action_router` hardcodeado y subworkflows especificos.

Tools configuradas para Ahumada:

- `message.send`
- `lead_state.update`
- `quote.create`
- `calendar.availability`
- `calendar.create_booking`
- `calendar.cancel_booking`
- `calendar.reschedule_booking`
- `handoff.create`
- `followup.schedule`
- `review.request`
- `referral.request`

Referencias:

- tool registry seed: `db/migrations/20260608_ai_agents_tool_registry_v1.sql:28`
- calendar tools: `db/migrations/20260608_ai_agents_tool_registry_v1.sql:52`
- action executor nodes: `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:25`
- auditoria/tool fallback: `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:79`
- build audit payload agent/tool-aware: `workflows/exports/uncategorized/6 - 6 action_executor__id-80e7685e-2690-4d1e-a5e7-5ccb7d0e8a13.json:248`

## 3. Verificacion de `lead_loader`

Antes:

- no cargaba `agent_id`;
- no cargaba `organization_id`;
- no cargaba config dinamica.

Ahora carga:

```json
{
  "organization": {},
  "agent": {},
  "agent_business_config": {},
  "agent_rules": [],
  "agent_tools": [],
  "routing": {
    "organization_id": "",
    "agent_id": ""
  }
}
```

Persistencia actual:

- `leads.organization_id`
- `leads.agent_id`
- `lead_state.organization_id`
- `lead_state.agent_id`

Riesgo pendiente:

- si entra un evento productivo sin `phone_number_id` o sin resolver agente, el flujo puede quedar en modo legacy. Esto debe ser una decision explicita: o bloquearlo, o mapearlo a un agente default controlado.

## 4. Analisis de `context_builder`

`context_builder` ya construye la estructura objetivo de Fase 4:

```json
{
  "organization": {},
  "agent": {},
  "business": {},
  "state": {},
  "tools": [],
  "knowledge": {},
  "allowed_actions": []
}
```

Estado de `business`:

- fuente preferida: `agent_business_config.config`;
- fallback: `business_rules` legacy.

Limitaciones actuales:

- `allowed_actions` sigue siendo calculado con mapas por stage dentro del workflow;
- parte de la logica de booking/cancel/reschedule sigue hardcodeada;
- no hay versionado runtime efectivo por ambiente mas alla de `agent_runtime_versions`.

## 5. Analisis de `rules_engine`

Estado actual: **hibrido**.

### Reglas ya configurables

- `lead_required_fields`;
- `required_fields_by_stage`;
- mensajes de datos faltantes;
- `next_goal_by_field`.

Referencias:

- `db/migrations/20260607_ai_agents_rules_engine_config_v1.sql:1`

### Reglas que siguen hardcodeadas

Todavia estan escritas directamente en JS:

- normalizacion de comunas;
- normalizacion de tipos de vehiculo;
- deteccion de intencion de pregunta;
- deteccion de objecion de precio/demora/competidor;
- deteccion de queja/reclamo;
- deteccion de cliente recurrente;
- deteccion de cotizacion;
- deteccion de menu de servicios;
- deteccion de recomendacion;
- deteccion de disponibilidad;
- seleccion de slot;
- confirmacion de booking;
- cancelacion;
- reagendamiento;
- handoff lock;
- reglas de post-servicio/review/referral;
- reglas de spam/empty message;
- stage machine comercial.

Conclusion:

- Fase 5 esta parcialmente implementada.
- El siguiente paso real debe ser extraer menu/servicios/coverage/aliases desde `agent_business_config` en todas las rutas, no solo en `context_builder`.

## 6. Analisis de `action_executor`

Estado actual: **tool registry hibrido**.

Ya existe:

```text
legacy action → mapped tool_name → audit/tool_registry
```

Ejemplos:

```text
confirm_booking → calendar.create_booking
cancel_booking → calendar.cancel_booking
reschedule_booking → calendar.reschedule_booking
send_quote → quote.create + message.send
acciones conversacionales → message.send
```

Limitaciones:

- el `action_router` sigue siendo un switch hardcodeado;
- los subworkflows `6.x` siguen siendo especificos del producto;
- `executor_ref` esta configurado, pero la ejecucion todavia no es un dispatcher generico universal tipo `tool_name → execute`.

Esto es suficiente para observabilidad multiagente, pero no aun para marketplace de tools SaaS.

## 7. Base de datos

### Tablas del closer actual

| Tabla | Proposito | Estado |
|---|---|---|
| `leads` | identidad/conversacion | Usada, ahora con `organization_id` y `agent_id` |
| `lead_state` | estado conversacional/comercial | Usada, ahora con `organization_id` y `agent_id` |
| `messages` | inbound/outbound | Usada |
| `offers_or_quotes` | cotizaciones | Usada |
| `appointments` | reservas | Usada |
| `followups` | seguimientos | Usada |
| `audit_logs` | trazabilidad | Usada |
| `qa_test_scenarios_temp` | escenarios QA | Usada |
| `qa_test_results` | resultados QA | Usada |

### Tablas AI Agents

| Tabla | Proposito | Estado |
|---|---|---|
| `organizations` | tenant/empresa | Implementada y sembrada |
| `agents` | agente por empresa | Implementada y sembrada |
| `agent_channels` | routing canal/numero → agente | Implementada; usada en QA router |
| `agent_business_config` | servicios, coverage, booking/pricing policy | Implementada; usada por context |
| `agent_rules` | reglas configurables iniciales | Implementada; usada por rules_engine |
| `agent_tools` | registry de tools | Implementada; usada por context/action audit |
| `agent_prompt_templates` | prompt dinamico por agente | Implementada; usada por llm_decision |
| `agent_runtime_versions` | version runtime | Implementada; uso inicial |
| `agent_knowledge_sources` | fuentes knowledge por agente | Implementada |
| `agent_knowledge_chunks` | chunks knowledge por agente | Implementada; usada por context/LLM |

### Tablas WhatsApp Meta

| Tabla | Proposito | Estado |
|---|---|---|
| `whatsapp_numbers` | configuracion multi-numero Meta | Parcial |
| `whatsapp_webhook_logs` | logs webhook/status Meta | Usada |

## 8. QA y evidencia reciente

### Multiagent fase 9

Archivo:

- `QA/results/qa_multiagent_380_389_final_2026-06-10.json`

Resumen:

```json
{
  "steps": 11,
  "scenarios": 10,
  "failed_steps": 0,
  "passed_steps": 11,
  "agent_id_steps": 8,
  "audit_ok_steps": 11,
  "tool_name_steps": 8,
  "organization_id_steps": 8
}
```

Interpretacion:

- pasan positivos agent-aware;
- negativos esperados no procesan;
- auditoria se mantiene;
- `agent_id`, `organization_id` y `tool_name` aparecen donde corresponde.

### PRD QA fase J/K/L/N

Archivos relevantes:

- `QA/results/qa_prd_phaseJ_451_456_results.json`
- `QA/results/qa_prd_phaseK_457_458_results.json`
- `QA/results/qa_prd_phaseL_460_whatsapp_status_handling.json`
- `QA/results/qa_prd_phaseL_461_outbound_send_failure.json`
- `QA/results/qa_prd_phaseN_467_471_results.json`

Resultados destacados:

- Fase J `451–456`: `failed_steps=0`, `audit_ok_steps=8`.
- Fase K `457–458`: `failed_steps=0`, `audit_ok_steps=4`.
- QA460 status handling: pasa para `sent`, `delivered`, `read`, `failed`.
- QA461 outbound send failure: pasa, registra error y no marca enviado.
- Fase N `467–471`: `failed_steps=0`, `agent_id_steps=10`, `audit_ok_steps=10`, `tool_name_steps=10`, `organization_id_steps=10`.
- Fix adicional validado: `QA/results/qa_prd_phaseN_467_lead_loader_fix_check.json`.

## 9. Resultado final

### Nota actual

**2 / 3 — preparado parcialmente para AI Agents.**

Escala:

- `0`: chatbot hardcodeado;
- `1`: closer modular para un negocio;
- `2`: preparado parcialmente para agents;
- `3`: arquitectura completa AI Agents SaaS.

### Justificacion

Sube de `1` a `2` porque:

- ya existe modelo multiempresa/multiagente;
- el lead/state ya persiste `organization_id` y `agent_id`;
- el flujo core ya transporta `organization`, `agent`, config, rules y tools;
- el prompt LLM ya puede venir desde templates por agente;
- el action executor ya audita `tool_name`;
- existe knowledge base por agente;
- QA multiagent y PRD QA recientes validan la capa.

No llega a `3` porque:

- el router productivo aun no resuelve `agent_channels` como fuente unica de verdad;
- no hay `channel_config_resolver` productivo independiente;
- `rules_engine` conserva mucha logica comercial hardcodeada;
- `action_executor` sigue siendo un switch legacy con tool observability, no un dispatcher generico completo;
- falta administrar agentes/config/versiones como producto SaaS;
- falta aislamiento multiempresa real de datos a nivel RLS/policies o enforcement sistematico;
- knowledge retrieval es basico, no un sistema RAG robusto versionado por fuente/embedding.

## 10. Que NO tocar sin QA especifico

No tocar sin una corrida QA focalizada:

- `6.5 confirm_booking_executor`;
- `6.6 cancel_booking`;
- `6.10 reschedule_booking`;
- `6.23 offer_available_slots`;
- `6.24 persist_and_audit`;
- idempotencia de `6 action_executor`;
- persistencia de `lead_state`;
- `qa_run_single_conversation` / scripts de extraccion QA.

Estas piezas ya pasaron varios QA y son sensibles a regresiones.

## 11. Que modificar primero

Orden recomendado:

1. Mover el resolver de `agent_channels` al flujo productivo:
   - crear o activar `channel_config_resolver`;
   - integrarlo entre `1 Inbound_router` y `2 lead_loader`;
   - dejar de depender de `allowed_phone_number_id` hardcodeado.
2. Unificar provider string:
   - decidir `meta_whatsapp_cloud_api` o `whatsapp_cloud_api`;
   - ajustar `agent_channels.provider`, router productivo y QA.
3. Extraer menu/servicios desde `agent_business_config` en todas las rutas:
   - `rules_engine`;
   - `send_service_menu`;
   - prompts;
   - subworkflows de respuesta.
4. Convertir `action_executor` de switch legacy a dispatcher hibrido real:
   - si `agent_tools.executor_type=workflow`, ejecutar `executor_ref`;
   - conservar fallback legacy por un periodo.
5. Agregar auditoria de descarte en router/resolver:
   - `unknown_number_block`;
   - `inactive_agent_block`;
   - `reason=agent_channel_not_found_or_inactive`.
6. Endurecer multiempresa:
   - constraints;
   - indices;
   - isolation checks;
   - posible RLS si Supabase expone datos fuera de n8n.

## 12. Cambios riesgosos

Riesgo alto:

- cambiar `rules_engine` sin QA por fase;
- tocar confirm/cancel/reschedule sin calendario limpio;
- tocar `lead_loader` porque afecta todos los escenarios;
- cambiar provider string sin migrar `agent_channels`;
- cambiar `action_executor` sin preservar `idempotency_key`;
- mover prompts/config sin fallback legacy.

Riesgo medio:

- ampliar `agent_business_config`;
- agregar nuevas tools inactivas;
- agregar nuevos chunks knowledge;
- agregar QA nuevos sin side effects.

## 13. Plan de migracion recomendado

### Fase A — Resolver productivo

Objetivo:

```text
WhatsApp metadata.phone_number_id
→ agent_channels.external_channel_id
→ agent
→ organization
```

Entregables:

- workflow `channel_config_resolver`;
- integracion productiva en `1 Inbound_router`;
- auditoria de descarte;
- QA para numero desconocido e inactivo.

### Fase B — Config comercial completa

Mover a `agent_business_config`:

- servicios;
- aliases;
- coverage;
- vehicle types;
- mensajes base;
- business hours;
- reglas de precio/booking.

### Fase C — Rules engine configurable por capas

Extraer primero:

- service menu;
- service aliases;
- coverage;
- required fields;
- allowed actions por stage.

Mantener hardcoded:

- idempotencia;
- no inventar precios;
- no inventar horarios;
- no confirmar sin direccion;
- handoff lock.

### Fase D — Tool dispatcher real

Convertir gradualmente:

```text
tool_name → executor_type + executor_ref
```

Mantener fallback:

```text
legacy_action → subworkflow 6.x
```

### Fase E — SaaS readiness

Agregar:

- admin/config pipeline;
- versionado activo por agente;
- rollback de config;
- validacion de config antes de activar;
- aislamiento de datos por organization.

## Conclusión

La arquitectura ya no es solamente un closer modular hardcodeado para un negocio. Hoy es una base agent-aware parcial, con DB multiagente, contextos dinamicos, prompt templates, knowledge, tool observability y QA multiagent pasando.

La brecha principal para llegar a arquitectura AI Agents SaaS completa no esta en crear tablas, sino en terminar de sacar del runtime productivo las dependencias legacy: resolver canal/agente en produccion, extraer reglas comerciales restantes, convertir el executor en dispatcher por tools y endurecer aislamiento multiempresa.
