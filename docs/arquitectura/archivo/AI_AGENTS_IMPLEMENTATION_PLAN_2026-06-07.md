# Plan de implementación capa AI Agents

Fecha: 2026-06-07  
Base: auditoría `docs/AI_AGENTS_ARCHITECTURE_AUDIT_2026-06-07.md`.

## Objetivo

Transformar el closer actual, hoy modular pero orientado a un solo negocio, en una arquitectura AI Agents multiempresa/multiagente sin romper producción ni QA existente.

La migración debe ser incremental:

```text
bot/closer actual
→ closer configurable
→ agent configurable por número
→ multiempresa
→ tool registry genérico
→ AI Agents SaaS
```

## Principios de implementación

1. No reescribir el core completo.
2. Mantener compatibilidad con Ahumada Detailing.
3. Introducir `organization` y `agent` como capa de configuración alrededor del flujo actual.
4. Mantener fallbacks si falta configuración.
5. Migrar reglas y tools por bloques pequeños.
6. Cada fase debe tener QA antes de avanzar.

## Arquitectura objetivo

```text
WhatsApp / canala
→ inbound_router
→ channel_config_resolver
→ lead_loader
→ agent_loader
→ rules_engine
→ context_builder
→ llm_decision
→ action_executor
→ tool_registry
→ persist_and_audit
```

Contexto objetivo para LLM:

```json
{
  "organization": {
    "id": "",
    "name": "",
    "timezone": "",
    "locale": ""
  },
  "agent": {
    "id": "",
    "name": "",
    "role": "",
    "personality": {},
    "policies": {},
    "model_config": {}
  },
  "business": {
    "services": [],
    "coverage": [],
    "pricing_policy": {},
    "booking_policy": {},
    "faq": []
  },
  "lead": {},
  "state": {},
  "conversation": {},
  "allowed_actions": [],
  "tools": [],
  "rule_context": {},
  "context_hints": {}
}
```

## Fase 0 — Congelar baseline

Objetivo: asegurar que el closer actual queda estable antes de migrar.

### Tareas

- Exportar workflows actuales desde n8n.
- Guardar baseline de QA actual.
- Documentar workflows activos y IDs efectivos.
- Confirmar que Ahumada Detailing sigue agendando, cancelando y reagendando.

### Entregables

- `docs/AI_AGENTS_ARCHITECTURE_AUDIT_2026-06-07.md`
- snapshot de exports actuales
- resultados QA base

### Criterio de salida

- QA principal pasa.
- No hay errores críticos de auditoría.
- No hay `bot_response` nulo en escenarios críticos.

## Fase 1 — Modelo de datos multiempresa/multiagente (COMPLETADO)

Objetivo: crear tablas nuevas sin modificar comportamiento actual.

### Tablas nuevas

```sql
organizations
agents
agent_channels
agent_business_config
agent_rules
agent_tools
agent_knowledge_sources
agent_prompt_templates
agent_runtime_versions
```

### Esquema propuesto

#### `organizations`

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  timezone text not null default 'America/Santiago',
  locale text not null default 'es-CL',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `agents`

```sql
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  slug text not null,
  name text not null,
  role text not null default 'closer',
  description text null,
  personality jsonb not null default '{}'::jsonb,
  model_config jsonb not null default '{}'::jsonb,
  policies jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
```

#### `agent_channels`

```sql
create table public.agent_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  channel text not null,
  provider text not null,
  external_channel_id text not null,
  display_name text null,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_channel_id)
);
```

#### `agent_business_config`

```sql
create table public.agent_business_config (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  config jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, version)
);
```

#### `agent_rules`

```sql
create table public.agent_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  rule_key text not null,
  priority integer not null default 100,
  rule_type text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, rule_key)
);
```

#### `agent_tools`

```sql
create table public.agent_tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  agent_id uuid not null references public.agents(id),
  tool_name text not null,
  executor_type text not null,
  executor_ref text not null,
  required_fields jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  side_effect_level text not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, tool_name)
);
```

### Criterio de salida

- Migración SQL aplicada.
- Ahumada Detailing creado como primera organización/agente.
- No se cambió aún el flujo runtime.

## Fase 2 — Resolver agente desde canal (COMPLETADO)

Objetivo: mapear cada mensaje entrante a un agente.

### Cambios

- Mantener `whatsapp_numbers`, pero vincularlo a `agent_channels`.
- Usar `phone_number_id` para resolver:

```text
phone_number_id
→ agent_channels.external_channel_id
→ agent_id
→ organization_id
```

### Workflow nuevo

Crear workflow:

```text
channel_config_resolver
```

Input:

```json
{
  "channel": "whatsapp",
  "provider": "meta_whatsapp_cloud_api",
  "phone_number_id": "",
  "lead_id": "",
  "message_id": ""
}
```

Output:

```json
{
  "organization": {},
  "agent": {},
  "channel_config": {},
  "routing": {
    "organization_id": "",
    "agent_id": "",
    "environment": "production"
  }
}
```

### Integración

Insertar entre:

```text
inbound_router → lead_loader
```

o dentro de `lead_loader` como paso inicial.

### Fallback

Si no encuentra agente:

- no procesar automáticamente,
- loggear evento,
- responder con handoff o descartar según entorno.

### Criterio de salida

- Mensajes actuales de Ahumada resuelven `agent_id`.
- Si llega un número no configurado, no rompe el flujo.

## Fase 3 — Extender lead_loader (COMPLETADO)

Objetivo: cargar estado del lead con tenant y agent.

### Cambios

Agregar a output de `lead_loader`:

```json
{
  "organization": {},
  "agent": {},
  "agent_business_config": {},
  "agent_rules": [],
  "agent_tools": []
}
```

### DB

Agregar columnas gradualmente:

```sql
alter table public.leads
add column if not exists organization_id uuid null,
add column if not exists agent_id uuid null;

alter table public.lead_state
add column if not exists organization_id uuid null,
add column if not exists agent_id uuid null;
```

### Fallback

Si `organization_id` o `agent_id` son null:

- usar modo legacy.
- mantener comportamiento actual.

### Criterio de salida

- `lead_loader` devuelve `agent_id`.
- QA actual sigue pasando.
- No hay duplicación de leads por cambio de tenant.

## Fase 4 — Context builder agent-aware (COMPLETADO)

Objetivo: que el LLM reciba configuración del agente.

### Cambios en `context_builder`

Agregar:

```json
{
  "organization": {},
  "agent": {},
  "business": {},
  "tools": []
}
```

`business` debe venir desde `agent_business_config.config`, no desde código.

### Compatibilidad legacy

Si no hay `agent_business_config`, usar el `businessRules` actual.

### Config inicial Ahumada

Mover a DB/config:

- servicios
- aliases de servicios
- comunas soportadas
- política de precios
- política de agenda
- duración default
- mensajes base
- límites del agente

### Criterio de salida

- `context_packet.agent.id` existe.
- `context_packet.business.services` viene de config.
- QA actual sigue pasando.

## Fase 5 — Rules engine híbrido (COMPLETADO)
 
Objetivo: extraer reglas configurables sin perder reglas críticas.

### Reglas a mover primero

- `required_fields_by_stage`
- mensajes de datos faltantes
- servicios disponibles
- aliases de servicios
- comunas soportadas
- tipos de vehículo
- allowed actions por stage

### Reglas que deben quedarse hardcodeadas temporalmente

- idempotencia
- no confirmar reserva sin dirección
- no inventar horarios
- no inventar precios
- handoff lock
- validación de acción permitida
- validación de campos requeridos por side-effect

### Output objetivo

```json
{
  "rule_result": {},
  "rule_trace": [],
  "config_used": {
    "agent_id": "",
    "rules_version": 1
  }
}
```

### Criterio de salida

- Una regla configurable funcionando.
- QA legacy sigue pasando.
- Se puede cambiar un mensaje desde DB/config sin editar workflow.

## Fase 6 — Prompt dinámico por agente (COMPLETADO)


Objetivo: remover prompt fijo del `llm_decision`.

### Cambios

Crear `agent_prompt_templates`:

- `decision_prompt`
- `tone_policy`
- `business_boundaries`
- `output_schema`
- `fallback_policy`

`llm_decision` debe construir el prompt desde:

```text
agent.personality
agent.policies
business config
allowed_actions
tools
```

### Criterio de salida

- Prompt Ahumada vive en config.
- Cambiar tono/persona no requiere editar workflow.
- Validación JSON se mantiene igual.

## Fase 7 — Tool registry híbrido (COMPLETADO)

Objetivo: evolucionar `action_executor` desde acciones fijas hacia tools configurables.

### Tool names sugeridos

```text
message.send
lead_state.update
quote.create
calendar.availability
calendar.create_booking
calendar.cancel_booking
calendar.reschedule_booking
handoff.create
followup.schedule
review.request
referral.request
```

### Estrategia

No borrar acciones actuales. Mapear:

```text
confirm_booking → calendar.create_booking
cancel_booking → calendar.cancel_booking
reschedule_booking → calendar.reschedule_booking
send_quote → quote.create + message.send
```

### Criterio de salida

- `action_executor` soporta modo legacy y modo tools.
- Al menos una tool se resuelve desde `agent_tools`.
- Auditoría incluye `tool_name`, `executor_ref`, `agent_id`.

## Fase 8 — Knowledge base por agente

Objetivo: responder preguntas usando fuentes por agente.

### Tablas

```text
agent_knowledge_sources
agent_knowledge_chunks
```

### Integración

Agregar antes de `llm_decision` o dentro de `context_builder`:

```text
knowledge_retriever
```

Output:

```json
{
  "knowledge": {
    "chunks": [],
    "source_ids": [],
    "retrieval_ok": true
  }
}
```

### Criterio de salida

- Preguntas de servicio se responden con knowledge del agente.
- El modelo no inventa servicios no configurados.

## Fase 9 — QA multiagente

Objetivo: validar que multiempresa no rompe el closer actual.

### QA mínimos

1. Ahumada legacy sigue pasando.
2. Ahumada agent-aware pasa.
3. Número no configurado no procesa.
4. Número configurado a agente inactivo no procesa.
5. Dos números enrutan a agentes distintos.
6. Dos agentes con servicios distintos no mezclan respuestas.
7. Un agente sin `calendar` no ofrece agenda.
8. Un agente sin pricing no confirma cotización.
9. `allowed_actions` cambia por agente.
10. Auditoría siempre incluye `organization_id` y `agent_id`.

### Resultado esperado por step QA

```json
{
  "passed": true,
  "agent_id": "...",
  "organization_id": "...",
  "decision_action": "...",
  "tool_name": "...",
  "audit_ok": true
}
```

## Orden técnico recomendado

1. SQL/migraciones.
2. Seeds de Ahumada como agente.
3. `channel_config_resolver`.
4. `lead_loader` con `agent_id`.
5. `context_builder` agent-aware.
6. QA de no-regresión.
7. `rules_engine` híbrido.
8. QA de reglas configurables.
9. prompt dinámico.
10. tool registry híbrido.
11. knowledge base.
12. QA multiagente.

## Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Romper QA de booking | Alto | Mantener modo legacy |
| Perder estado de lead | Alto | Migrar columnas nullable |
| Duplicar leads por tenant | Alto | Diseñar unique keys antes |
| LLM cambia respuestas | Medio/alto | Mantener schema y guardrails |
| Tools dinámicas mal configuradas | Alto | Validación fuerte y fallback |
| Agente sin config completa | Medio | Defaults seguros |

## No hacer todavía

- No reemplazar todo `rules_engine` de una vez.
- No borrar acciones actuales del `action_executor`.
- No cambiar `lead_state` a una estructura 100% genérica todavía.
- No mover pricing/calendario sin QA específico.
- No activar multiempresa real hasta tener auditoría con `agent_id`.

## Primer sprint recomendado

### Alcance

Implementar base multiagente sin cambiar comportamiento visible.

### Tareas

1. Crear migración SQL con:
   - `organizations`
   - `agents`
   - `agent_channels`
   - `agent_business_config`
   - `agent_rules`
   - `agent_tools`
2. Crear seed `ahumada_detailing`.
3. Vincular `whatsapp_numbers.phone_number_id` con `agent_channels`.
4. Crear workflow `channel_config_resolver`.
5. Hacer que `lead_loader` pase `organization` y `agent` hacia adelante.
6. Agregar campos al `context_packet` sin usarlos todavía para decidir.
7. Crear QA `agent_resolution`.

### Definition of Done

- Un mensaje entrante resuelve `organization_id` y `agent_id`.
- `context_packet.agent.id` existe.
- El flujo Ahumada sigue funcionando igual.
- QA legacy pasa.
- QA agent resolution pasa.

## Segundo sprint recomendado

### Alcance

Convertir contexto y reglas simples a configuración.

### Tareas

1. Mover servicios a `agent_business_config`.
2. Mover comunas soportadas a `agent_business_config`.
3. Mover mensajes de datos faltantes a config.
4. Modificar `rules_engine` para leer config con fallback legacy.
5. Crear QA de servicios/config.

### Definition of Done

- Cambiar un servicio en config cambia la respuesta sin editar workflow.
- El modelo no ofrece servicios fuera de config.
- QA de Ahumada sigue pasando.

## Tercer sprint recomendado

### Alcance

Introducir tool registry híbrido.

### Tareas

1. Crear tools base.
2. Mapear acciones actuales a tools.
3. Agregar auditoría de `tool_name`.
4. Migrar una acción no crítica primero, por ejemplo `send_service_menu`.
5. Luego migrar `send_quote`.
6. Después migrar booking/cancel/reschedule.

### Definition of Done

- Una acción se ejecuta desde `agent_tools`.
- Auditoría incluye tool.
- Fallback legacy sigue disponible.

## Conclusión

La forma correcta de implementar AI Agents en este repo es envolver el closer actual con una capa `organization + agent + config`, no reescribirlo. El sistema ya tiene buena separación operacional; la deuda principal es que las reglas, herramientas y prompts no son configurables por agente. La migración debe avanzar primero por resolución de agente y contexto, luego por reglas, y finalmente por tools dinámicas.
