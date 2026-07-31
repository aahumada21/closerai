# Errores QA multiagente 380-389

Fuente analizada:

- `QA/results/qa_multiagent_380_389.json`
- `QA/results/qa_multiagent_380_389_latest.json`

## Resumen

- Total steps: `12`
- Passed: `2`
- Failed: `10`
- `audit_ok`: `0/12`
- `tool_name`: `0/12`
- `agent_id`: `2/12`
- `organization_id`: `2/12`

Conclusion: el QA multiagente no paso. Los casos negativos `569900382` y `569900383` pasaron porque esperaban no procesar, pero los casos positivos no llegaron a respuesta real ni auditoria.

## 1) No hay respuesta del bot en casos positivos

Estado: **corregido para `569900381` tras fix en `4 context_builder`**.

Casos:

- `569900380` steps 1 y 2
- `569900381` steps 1 y 2
- `569900384` a `569900389`

Errores:

- `bot is null or empty`
- `no response, no action, no state change`

Impacto:

- El QA no esta atravesando el pipeline completo hasta `action_executor`.
- No se puede validar comportamiento de negocio multiagente.

Zona probable del problema:

- `workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json`
- `workflows/exports/uncategorized/9.1 - 9.1.1 qa_run_single_conversation__id-34092303-cb4a-4fd2-800e-ac16f650fc52.json`

Hipotesis concreta:

- El QA router esta creando/normalizando el evento, pero la ejecucion no termina generando mensaje outbound.
- Puede estar quedando cortado antes de `action_executor`, o el workflow activo en n8n no corresponde al export local corregido.

Causa raiz confirmada:

- `2 lead_loader` caia al ejecutar el pipeline posterior porque `4 context_builder` tenia SQL invalido en el nodo `load_agent_knowledge`.
- Error n8n: `column "chunk_id" does not exist`.
- El query agregaba `jsonb_agg(jsonb_build_object(... chunk_id ...))`, pero no tenia `FROM ranked` al final, por lo que Postgres no tenia la CTE en scope.

Fix aplicado:

- Archivo corregido: `workflows/exports/uncategorized/4 - 4 context_builder__id-5f5ef274-4b7a-4a1a-b463-ff22e5eae55e.json`.
- Cambio: se agrego `FROM ranked;` al SELECT final de `load_agent_knowledge`.
- Workflow subido a n8n: `4 context_builder`.

Evidencia post-fix:

- Re-ejecucion: `569900381`.
- Resultado guardado: `QA/results/qa_multiagent_569900381_after_context_fix.json`.
- Steps: `2/2 passed`.
- `audit_ok`: `2/2`.
- `agent_id`: presente.
- `organization_id`: presente.
- `bot_response`: presente.

## 2) Auditoria real ausente

Estado: **resuelto para casos positivos con agente tras corregir fixtures `agent_channels`**.

Casos:

- Todos los steps, incluidos los que pasan como negativos.

Errores:

- `empty audit: missing flow_name, decision, idempotency_key or current-step correlation`
- `audit_ok=false`

Impacto:

- No hay trazabilidad de `action_executor`.
- No se puede validar `decision_action`, `tool_name`, ni side effects.

Zona probable del problema:

- `9.1.1 qa_run_single_conversation` en nodo `get_last_audit` / `validate_step_result`.
- `6 action_executor` / `6.24 persist_and_audit` si el evento si llega al executor pero no escribe audit.

Hipotesis concreta:

- Para los casos positivos no se esta insertando `audit_logs` correlacionado con `qa_message_id`.
- Si existe auditoria, puede estar con `inbound_message_id` distinto o sin `latest_user_message`, por eso no correlaciona.

Causa raiz confirmada:

- Los canales QA `qa-phone-agent-lavado`, `qa-phone-agent-polarizado` y `qa-phone-agent-inactive` no existian en `public.agent_channels`.
- El SQL `QA/sql/qa_multiagent_380_389.sql` usaba CTEs con INSERT y luego consultaba `public.agents` dentro del mismo statement. En Postgres, esas escrituras no quedan visibles para otras lecturas del mismo statement salvo via `RETURNING`.
- Resultado: solo existia `qa-phone-ahumada-agent-aware`; por eso `569900381` funcionaba y `569900384`-`569900389` no llegaban al executor.

Fix aplicado:

- `QA/sql/qa_multiagent_380_389.sql` ahora usa el CTE `qa_agents` via `RETURNING` para crear configs, channels y tools.
- Se recargaron fixtures y ahora existen los 4 canales:
  - `qa-phone-ahumada-agent-aware`
  - `qa-phone-agent-lavado`
  - `qa-phone-agent-polarizado`
  - `qa-phone-agent-inactive`

Evidencia post-fix:

- Re-ejecucion: `569900389`.
- Resultado guardado: `QA/results/qa_multiagent_569900389_after_fixture_fix.json`.
- `audit_ok=true`.
- `agent_id` presente.
- `organization_id` presente.
- `bot_response` presente.
- `decision_action=ask_missing_data`.

Pendiente separado:

- `tool_name` sigue `null`; eso pertenece al problema de observabilidad del tool registry, no a ausencia de auditoria.

## 3) Resolucion de agente incompleta

Estado actual:

- **Corregido para `569900384` a `569900389`** en la corrida `QA/results/qa_multiagent_380_389_after_9_0_upload.json`.
- DB validada: existen `agent_channels` activos para `qa-phone-agent-lavado`, `qa-phone-agent-polarizado`, `qa-phone-ahumada-agent-aware` y `qa-phone-agent-inactive`.
- Se subio nuevamente `9.0 qa_whatsapp_normalized_router` y desde ahi los casos agent-aware ya resuelven `agent_id` y `organization_id`.

Casos originales:

- `569900381` resolvio `agent_id` y `organization_id`.
- `569900384` a `569900389` no resolvieron `agent_id` ni `organization_id`.

Errores:

- `agent_id missing`
- `organization_id missing`

Impacto:

- No se validan dos agentes distintos.
- No se validan servicios separados por agente.
- No se valida tool registry por agente.

Zona probable del problema:

- Fixtures en `QA/sql/qa_multiagent_380_389.sql`.
- Resolver en `9.0 qa_whatsapp_normalized_router`, nodos:
  - `resolve_agent_channel_for_qa`
  - `attach_agent_context_or_stop`

Hipotesis concreta:

- Los `agent_channels` para `qa-phone-agent-lavado` y `qa-phone-agent-polarizado` no quedaron cargados o no estan activos en DB.
- Tambien puede ser que el export local de `9.0` no haya sido subido despues de agregar el resolver.

Resultado de validacion:

- La DB estaba correcta.
- La causa operativa era sincronizacion/corrida stale: el export `9.0` fue subido y la nueva corrida ya resuelve agente.
- Queda pendiente otro problema separado: `tool_name` sigue `null` en auditoria.

Validacion directa:

```sql
select
  ac.external_channel_id,
  ac.is_active as channel_active,
  a.slug as agent_slug,
  a.is_active as agent_active,
  o.slug as organization_slug,
  o.is_active as organization_active
from public.agent_channels ac
join public.agents a on a.id = ac.agent_id
join public.organizations o on o.id = ac.organization_id
where ac.external_channel_id in (
  'qa-phone-ahumada-agent-aware',
  'qa-phone-agent-lavado',
  'qa-phone-agent-polarizado',
  'qa-phone-agent-inactive'
)
order by ac.external_channel_id;
```

## 4) Tool registry no observable

Estado actual:

- **Corregido para `569900389`** en `QA/results/qa_multiagent_569900389_after_toolname_fix.json`.
- Resultado validado: `passed=true`, `tool_name=message.send`, `audit_ok=true`, `agent_id` y `organization_id` presentes.

Casos:

- `569900389`
- Todos los casos positivos donde deberia existir `tool_name`.

Errores:

- `expected tool_name: message.send | received: null`
- `tool_name_steps: 0`

Impacto:

- Fase 7 no queda validada por QA.
- No se puede probar `message.send`, `calendar.*`, `quote.create`, etc. por agente.

Zona probable del problema:

- `6 action_executor`, resolucion `tool_registry`.
- `9.1.1 validate_step_result`, lectura desde `audit_snapshot.meta.tool_registry`.

Hipotesis concreta:

- La auditoria real existia, pero `tool_name` quedaba `null`.
- El `tool_registry` ya tenia `mapped_tool_names=["message.send"]`, pero `6 action_executor` no lo promovia a `tool_name` cuando no habia `primaryTool` resuelta.
- `9.1.1 validate_step_result` tampoco leia `mapped_tool_names` como fallback.

Fix aplicado:

- `6 action_executor`: usa `primaryMappedToolName = primaryTool?.tool_name || toolNamesForAction[0] || null` y lo propaga a `tool_registry.tool_name`, `execution_context.tool_name`, `meta.tool_name` y auditoria.
- `9.1.1 qa_run_single_conversation`: lee `auditMeta.tool_name`, `auditToolRegistry.tool_name` y como fallback `auditToolRegistry.mapped_tool_names[0]`.

## 5) Casos negativos pasaron, pero con cautela

Estado actual:

- **Corregido** en `9.0 qa_whatsapp_normalized_router`.
- `569900382` y `569900383` siguen pasando.
- Ahora ambos generan auditoria liviana con `flow_name=qa_whatsapp_normalized_router`, `decision.action=not_processed`, `reason=agent_channel_not_found_or_inactive`.
- Resultado validado en `QA/results/qa_multiagent_382_383_after_discard_audit.json`.

Casos:

- `569900382`: numero no configurado no procesa.
- `569900383`: agente inactivo no procesa.

Resultado:

- `passed=true`
- `bot_response=null`
- `audit_ok=true`
- `decision_action=not_processed`

Interpretacion:

- Esto es correcto solo porque el escenario esperaba `should_process=false`.
- Ahora tambien valida que exista auditoria de descarte del router.

Mejora recomendada:

- Mantener esta auditoria liviana para todo descarte multiagente.
- Si luego se crea `channel_config_resolver` como workflow separado, mover este audit ahi para centralizar la responsabilidad.

Fix aplicado:

- Nuevo nodo `audit_not_processed` en `9.0`.
- El QA `9.1.1` permite auditoria de descarte como no-procesamiento valido cuando `expect.should_process=false`.

## Orden recomendado para solucionar

1. Re-ejecutar suite completa `569900380`-`569900389` con los exports ya subidos.
2. Revisar solo fallos restantes con resultado fresco.
3. Separar `569900380` legacy: decidir si se mantiene como compatibilidad obligatoria o si debe mapear al agente default.
4. Para casos positivos restantes, validar contenido semantico por agente (`lavado` vs `polarizado`).
5. Confirmar que `tool_name`, `decision_action`, `agent_id`, `organization_id` aparecen en todos los positivos.

## Queries utiles

### Ultima auditoria por lead fallido

```sql
select
  a.created_at,
  a.flow_name,
  a.decision->>'action' as action,
  a.idempotency_key,
  a.inbound_message_id,
  a.latest_user_message,
  a.meta->>'agent_id' as agent_id,
  a.meta->>'organization_id' as organization_id,
  a.meta->>'tool_name' as tool_name
from public.audit_logs a
where a.lead_id = '<lead_id>'::uuid
order by a.created_at desc
limit 20;
```

### Mensajes outbound por lead fallido

```sql
select
  created_at,
  direction,
  content,
  provider_status,
  status
from public.messages
where lead_id = '<lead_id>'::uuid
order by created_at desc
limit 20;
```

### Estado actual por lead fallido

```sql
select
  lead_id,
  organization_id,
  agent_id,
  stage,
  next_goal,
  last_bot_action,
  service_interest,
  vehicle_type,
  district,
  updated_at
from public.lead_state
where lead_id = '<lead_id>'::uuid;
```
