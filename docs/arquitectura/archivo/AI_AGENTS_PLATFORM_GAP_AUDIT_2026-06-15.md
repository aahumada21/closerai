# Gap audit de plataforma AI Agents tipo Vambe

Fecha: 2026-06-15  
Documento relacionado: `docs/AI_AGENTS_ARCHITECTURE_AUDIT_2026-06-15.md`  
Objetivo: listar capacidades que faltan para pasar de un AI Closer agent-aware a una plataforma conversacional SaaS comparable a soluciones comerciales tipo Vambe.

## 1. Resumen

El sistema actual ya tiene una base tecnica agent-aware:

- multiagente parcial;
- DB de organizaciones/agentes/canales/tools;
- QA multiagente;
- WhatsApp Cloud API;
- booking, cotizacion, cancelacion, reagendamiento y auditoria.

Lo que falta no es solo mas workflows. Falta una capa de **producto SaaS** alrededor del runtime:

- omnicanalidad;
- team inbox;
- CRM/revenue ops;
- campañas outbound;
- configuracion self-service;
- seguridad multiempresa;
- billing/usage;
- observabilidad operacional;
- evaluaciones de agentes;
- integraciones externas;
- knowledge lifecycle.

## 2. Capacidades faltantes principales

| Area | Estado actual | Gap | Prioridad |
|---|---|---|---:|
| Omnicanalidad | WhatsApp fuerte, webchat/Instagram no implementados | Falta capa de adapters por canal | P0 |
| Team inbox | Handoff existe a nivel estado | Falta consola humana, asignacion, SLA, notas | P0 |
| CRM comercial | Leads/state existen | Falta pipeline, oportunidades, owners, revenue | P0 |
| Campañas outbound | Followups existen | Falta broadcast, segmentos, templates y opt-in/out | P1 |
| Admin SaaS | Config en DB/migrations | Falta panel self-service para agentes/canales/tools | P1 |
| Provisioning | Manual por scripts/API | Falta onboarding guiado de tenant/canales | P1 |
| Seguridad multiempresa | `organization_id` existe | Falta RBAC/RLS/policies/secret isolation | P0 |
| Billing/usage | No centralizado | Falta medicion de mensajes, tokens, tools, costos | P1 |
| Reliability | QA fuerte | Falta colas, DLQ, circuit breakers, rate limits | P0 |
| Evals de agentes | QA por escenarios | Falta scorecards/version gates/datasets por agente | P1 |
| Knowledge lifecycle | Knowledge tables existen | Falta gestion, versionado, reindex, freshness | P1 |
| Integraciones | Tools hibridas | Falta marketplace/connectors por tenant | P2 |
| Pagos/commerce | Booking/cotizacion | Falta pago, orden, checkout, postventa comercial | P2 |

## 3. Omnicanalidad

### Faltante

Implementar canales adicionales sin contaminar el core:

- Instagram DM;
- webchat;
- Facebook Messenger;
- email;
- formularios web;
- futuros canales.

### Implementacion recomendada

Crear adapters por canal:

```text
whatsapp_inbound_adapter
instagram_inbound_adapter
webchat_inbound_adapter
        ↓
channel_config_resolver
        ↓
core AI Closer
        ↓
outbound_message_dispatcher
        ↓
adapter outbound por canal
```

### Artefactos relacionados

- `docs/OMNICHANNEL_IMPLEMENTATION_GUIDE_2026-06-15.md`

### QA necesario

- mismo agente responde por distintos canales;
- distintos canales enrutan a agentes distintos;
- canal desconocido no procesa y audita descarte;
- outbound failure por canal no duplica mensaje.

## 4. Team inbox y operaciones humanas

### Faltante

Hoy existe `handoff_human`, pero falta una capa operativa para humanos:

- bandeja de conversaciones;
- asignacion de agente humano;
- estados: abierto, pendiente, resuelto, cerrado;
- notas internas;
- tags;
- SLA;
- prioridad;
- historial consolidado;
- reanudacion de automatizacion.

### DB sugerida

```text
conversation_threads
conversation_assignments
conversation_notes
conversation_tags
handoff_cases
sla_events
```

### Workflows sugeridos

```text
team_inbox_assign_conversation
team_inbox_add_note
team_inbox_close_thread
team_inbox_resume_automation
team_inbox_sla_monitor
```

### QA necesario

- handoff crea caso;
- bot se detiene tras handoff;
- humano puede cerrar caso;
- automatizacion se reanuda solo cuando corresponde;
- auditoria registra humano/fecha/motivo.

## 5. CRM y revenue ops

### Faltante

El sistema tiene `leads` y `lead_state`, pero no tiene CRM comercial completo.

Falta modelar:

- oportunidades/deals;
- pipeline stages;
- owner comercial;
- source/campaign;
- valor estimado;
- revenue ganado/perdido;
- motivo de perdida;
- conversion rate;
- forecast;
- atribucion por canal/campaña.

### DB sugerida

```text
crm_pipelines
crm_pipeline_stages
crm_deals
crm_deal_events
crm_owners
crm_sources
crm_revenue_attribution
```

### Workflows sugeridos

```text
crm_create_or_update_deal
crm_move_deal_stage
crm_record_conversion
crm_record_lost_reason
crm_attribution_tracker
```

### QA necesario

- cotizacion crea deal;
- booking mueve deal a etapa agendada;
- cancelacion mueve deal o lo marca en riesgo;
- venta completada registra revenue;
- fuente/canal queda asociado.

## 6. Campañas outbound y nurturing

### Faltante

Los followups existen, pero falta una capa de campañas:

- segmentos;
- broadcast;
- plantillas WhatsApp/Meta;
- opt-in/opt-out;
- control de frecuencia;
- campañas de recuperacion;
- campañas post-servicio;
- atribucion de campaña.

### DB sugerida

```text
marketing_segments
marketing_campaigns
campaign_recipients
campaign_messages
contact_consents
message_templates
frequency_caps
```

### Workflows sugeridos

```text
campaign_segment_builder
campaign_send_batch
campaign_delivery_tracker
campaign_reply_router
consent_manager
```

### QA necesario

- no enviar sin consentimiento;
- no duplicar mensaje en reintento;
- respetar frequency cap;
- respuesta a campaña retoma contexto correcto;
- campaña atribuye conversion.

## 7. Admin SaaS y configuracion self-service

### Faltante

Hoy la configuracion vive en SQL/migrations/export JSON. Para una plataforma tipo SaaS falta:

- panel para crear organizaciones;
- crear agentes;
- conectar canales;
- editar servicios;
- editar knowledge;
- editar prompts;
- activar/desactivar tools;
- versionar configuracion;
- aprobar cambios antes de produccion;
- rollback.

### DB/funciones sugeridas

```text
config_change_requests
config_versions
config_approvals
agent_deployments
agent_config_snapshots
```

### Workflows sugeridos

```text
agent_config_validate
agent_config_publish
agent_config_rollback
agent_health_check
```

### QA necesario

- config invalida no se publica;
- cambio de servicios no rompe agente existente;
- rollback restaura respuesta previa;
- agente inactivo no procesa.

## 8. Provisioning multiempresa

### Faltante

Alta de cliente todavia depende de pasos manuales.

Falta:

- crear tenant;
- crear agente default;
- conectar WhatsApp/Instagram/webchat;
- registrar numero Meta;
- verificar webhook;
- cargar config inicial;
- cargar knowledge inicial;
- correr smoke QA automatico.

### Workflow sugerido

```text
tenant_onboarding_orchestrator
```

Pasos:

```text
create organization
→ create default agent
→ create agent_channels
→ register provider credentials
→ verify webhook
→ seed business config
→ seed tools
→ run smoke QA
→ mark tenant active
```

### QA necesario

- tenant nuevo queda activo;
- tenant incompleto queda en draft;
- webhook invalido no activa canal;
- secrets no quedan en logs.

## 9. Seguridad, privacidad y compliance

### Faltante

Existe `organization_id`, pero falta enforcement sistematico.

Agregar:

- RBAC;
- roles por usuario;
- permisos por organizacion;
- RLS/policies si aplica;
- masking de PII;
- retencion de datos;
- export/delete customer data;
- secrets por tenant;
- auditoria de acceso humano.

### DB sugerida

```text
users
organization_members
roles
permissions
access_audit_logs
data_retention_policies
secret_references
```

### QA necesario

- usuario org A no ve org B;
- logs no exponen tokens;
- PII sensible se enmascara;
- delete/export por lead funciona;
- secrets no viajan en `audit_logs`.

## 10. Billing y usage

### Faltante

No hay capa de medicion comercial por tenant.

Medir:

- mensajes inbound/outbound;
- tokens LLM;
- llamadas a tools;
- errores provider;
- conversaciones activas;
- reservas/cotizaciones;
- costo por canal;
- revenue generado.

### DB sugerida

```text
usage_events
usage_daily_rollups
billing_accounts
billing_plans
invoices
cost_events
```

### Workflows sugeridos

```text
usage_event_collector
usage_rollup_daily
billing_limit_guard
```

### QA necesario

- cada mensaje genera usage event;
- cada llamada LLM registra tokens/costo;
- limite de plan bloquea o degrada correctamente;
- usage no mezcla organizaciones.

## 11. Reliability productiva

### Faltante

El sistema tiene QA e idempotencia, pero falta infraestructura operacional:

- colas;
- retries controlados;
- dead letter queue;
- circuit breakers por provider;
- rate limits;
- backoff;
- health checks;
- alertas;
- SLOs;
- dashboards.

### DB sugerida

```text
job_queue
dead_letter_events
provider_health
retry_policies
workflow_incidents
```

### Workflows sugeridos

```text
retry_worker
dead_letter_reprocessor
provider_health_monitor
incident_notifier
```

### QA necesario

- error temporal reintenta;
- error permanente va a DLQ;
- provider caido activa fallback;
- reintento no duplica mensajes/citas/audit.

## 12. Evaluacion de agentes

### Faltante

Hay QA por escenarios, pero falta sistema de evals por agente/config/version.

Agregar:

- datasets por agente;
- scorecards;
- thresholds;
- comparacion entre versiones;
- aprobacion antes de activar config;
- tests semanticos;
- tests de seguridad;
- regression suite automatica.

### DB sugerida

```text
agent_eval_sets
agent_eval_cases
agent_eval_runs
agent_eval_results
agent_release_gates
```

### QA necesario

- nueva config no se activa si baja score;
- respuesta respeta knowledge;
- no inventa precio/horario;
- no mezcla servicios entre agentes.

## 13. Knowledge lifecycle

### Faltante

Ya existen `agent_knowledge_sources` y `agent_knowledge_chunks`, pero falta administracion completa.

Agregar:

- carga de documentos;
- versionado;
- chunking controlado;
- embeddings si se usa vector search;
- freshness;
- desactivacion de fuentes;
- aprobacion de cambios;
- trazabilidad de fuente usada;
- citas internas.

### Workflows sugeridos

```text
knowledge_source_ingest
knowledge_chunk_builder
knowledge_reindex
knowledge_validate_against_agent
knowledge_retire_source
```

### QA necesario

- pregunta de servicio usa knowledge correcto;
- fuente desactivada no se usa;
- agente no inventa servicio no configurado;
- cambio de knowledge queda versionado.

## 14. Integraciones y marketplace de tools

### Faltante

`agent_tools` existe, pero falta un ecosistema configurable de conectores.

Tools futuras:

- CRM externo;
- Google Calendar;
- Calendly;
- Shopify/WooCommerce;
- Stripe/MercadoPago;
- HubSpot/Pipedrive;
- Google Sheets;
- email;
- analytics;
- helpdesk.

### DB sugerida

```text
tool_catalog
tool_installations
tool_credentials
tool_permissions
tool_execution_logs
```

### QA necesario

- tool desactivada no se ejecuta;
- tool sin credential deriva a humano o fallback;
- error de tool queda auditado;
- tool no accede a otro tenant.

## 15. Pagos y commerce

### Faltante

Para conversacional commerce completo falta:

- links de pago;
- estado de pago;
- orden;
- factura/boleta;
- carrito/servicio seleccionado;
- promociones;
- postventa;
- refund/cancelacion comercial.

### DB sugerida

```text
orders
order_items
payments
payment_links
refunds
promotions
commerce_events
```

### Workflows sugeridos

```text
payment_link_create
payment_status_webhook
order_create_from_booking
post_purchase_followup
```

### QA necesario

- cotizacion genera link de pago;
- pago confirmado actualiza booking/deal;
- pago fallido no confirma servicio;
- refund queda auditado.

## 16. Orden recomendado de implementacion

### P0 — Base plataforma

1. `channel_config_resolver` productivo.
2. Refactor WhatsApp inbound sin filtro hardcodeado.
3. `outbound_message_dispatcher`.
4. Auditoria de descartes por canal/agente.
5. Team inbox minimo para handoff.
6. Seguridad multiempresa basica.
7. Reliability: retry + DLQ para side effects.

### P1 — Escalar producto

8. Webchat.
9. Instagram DM.
10. CRM deals/pipeline.
11. Admin SaaS para config de agentes.
12. Usage/billing events.
13. Evals por agente/version.
14. Knowledge lifecycle.

### P2 — Expansion comercial

15. Campañas outbound.
16. Integraciones marketplace.
17. Pagos y commerce.
18. Revenue attribution avanzado.
19. Dashboards ejecutivos.

## 17. Criterio de "listo tipo plataforma"

El sistema puede considerarse plataforma AI Agents SaaS cuando:

- un cliente nuevo se puede onboardear sin tocar SQL/manual exports;
- un canal nuevo se puede conectar por UI/API;
- cada canal enruta por `agent_channels`;
- cada agente tiene config, prompts, tools y knowledge versionados;
- cada respuesta tiene auditoria con `organization_id`, `agent_id`, `tool_name`, `channel`, `provider`;
- un humano puede intervenir y devolver control al bot;
- los errores se reintentan o van a DLQ;
- hay usage/billing por tenant;
- QA/evals bloquean releases malos;
- no hay hardcoding comercial de Ahumada en rutas multiagente.

## 18. Conclusion

El runtime actual ya es una buena base tecnica. La brecha para parecerse a una plataforma tipo Vambe esta en producto, operaciones y gobernanza:

- convertir canales en adapters;
- convertir configuracion en self-service;
- convertir handoff en team inbox;
- convertir leads en CRM/revenue;
- convertir QA en eval/release gates;
- convertir tools en marketplace;
- convertir logs en observabilidad operacional y billing.

La prioridad inmediata debe ser **resolver omnicanalidad productiva + team inbox + seguridad multiempresa + reliability**, porque esas cuatro capas son la base para escalar sin romper el AI Closer actual.
