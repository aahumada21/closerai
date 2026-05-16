# Base de datos ordenada — AI Closer / Ahumada Detailing

Este documento ordena tu esquema actual de Supabase/Postgres por responsabilidad lógica, dependencias y uso dentro del sistema comercial.

> Objetivo: que la base de datos sea fácil de entender, mantener, auditar y conectar con los workflows de n8n.

---

# 1. Orden lógico de la base de datos

## Módulo A — Identidad y conversación

Estas tablas representan al cliente y el historial conversacional.

### `leads`

Tabla principal de clientes/leads.

**Responsabilidad**
- Identificar a cada lead por canal.
- Evitar duplicados usando `channel + external_id`.
- Servir como raíz para estado, mensajes, cotizaciones, citas y followups.

**Campos clave**
- `id`
- `channel`
- `external_id`
- `phone`
- `name`
- `created_at`
- `updated_at`

**Índices actuales**
- `leads_channel_external_id_uidx` en `(channel, external_id)`

**Estado**
✅ Correcta como tabla raíz.

---

### `messages`

Historial de mensajes entrantes y salientes.

**Responsabilidad**
- Guardar mensajes del usuario y del bot.
- Permitir reconstruir conversaciones.
- Permitir QA y auditoría de respuestas.

**Campos clave**
- `lead_id`
- `direction`
- `channel`
- `message_type`
- `content`
- `provider_message_id`
- `provider_status`
- `status`
- `created_at`

**Relación**
- `messages.lead_id → leads.id`

**Índices actuales**
- `idx_messages_provider_id`
- `idx_messages_lead_id`
- `idx_messages_lead_created`

**Estado**
✅ Bien estructurada.

**Mejora recomendada**
Agregar check constraint para `direction`:

```sql
alter table public.messages
add constraint messages_direction_check
check (direction in ('inbound', 'outbound', 'system'));
```

Agregar unique opcional para evitar duplicar mensajes entrantes de WhatsApp:

```sql
create unique index if not exists uq_messages_provider_message_id
on public.messages(provider_message_id)
where provider_message_id is not null;
```

---

## Módulo B — Estado comercial del lead

### `lead_state`

Tabla central del estado comercial actual del lead.

**Responsabilidad**
- Guardar la etapa actual del cliente.
- Guardar intención, servicio, vehículo, comuna y siguiente objetivo.
- Guardar datos temporales de agenda.
- Controlar handoff humano.
- Ser la fuente de verdad para el flujo conversacional.

**Campos comerciales**
- `stage`
- `intent_last`
- `interest_score`
- `service_interest`
- `vehicle_type`
- `district`
- `missing_fields`
- `last_bot_action`
- `next_goal`
- `human_handoff`

**Campos de agenda**
- `booking_options`
- `booking_date`
- `booking_time`
- `slot_id`
- `availability_confirmed`
- `calendar_id`
- `duration_minutes`
- `days_ahead`
- `start_offset_days`
- `max_slots`

**Campos de dirección**
- `service_address`
- `address_reference`
- `address_confirmed`
- `address_confirmed_at`

**Relación**
- `lead_state.lead_id → leads.id`

**Estado**
✅ Es una tabla clave y está bien orientada para n8n.

**Mejora recomendada**
Agregar check constraint para etapas permitidas:

```sql
alter table public.lead_state
add constraint lead_state_stage_check
check (
  stage in (
    'new_lead',
    'qualifying',
    'qualified',
    'quoted',
    'closing',
    'booked',
    'collecting_address',
    'address_confirmed',
    'reschedule',
    'cancelled',
    'post_service',
    'reactivation',
    'lost',
    'human_handoff'
  )
);
```

---

## Módulo C — Pricing y cotizaciones

Estas tablas definen precios, recargos y cotizaciones enviadas.

### `pricing_versions`

Versionado de precios.

**Responsabilidad**
- Permitir tener una versión activa de precios.
- Evitar modificar precios históricos.
- Relacionar cotizaciones con una versión específica.

**Campos clave**
- `id`
- `name`
- `is_active`
- `valid_from`
- `valid_to`
- `created_at`

**Índice actual**
- `uq_pricing_versions_one_active`, único cuando `is_active = true`.

**Estado**
✅ Muy buena decisión. Permite trazabilidad comercial.

---

### `service_vehicle_prices`

Precios base por servicio y tipo de vehículo.

**Responsabilidad**
- Guardar precio base según:
  - versión de precios
  - servicio
  - tipo de vehículo

**Campos clave**
- `pricing_version_id`
- `service_code`
- `vehicle_type`
- `base_price`
- `is_active`

**Relación**
- `service_vehicle_prices.pricing_version_id → pricing_versions.id`

**Estado**
✅ Correcta.

**Mejora recomendada**
Estandarizar `service_code` para no mezclar nombres comerciales con códigos internos.

Ejemplo recomendado:
- `lavado_basico`
- `lavado_premium`
- `encerado_full`

---

### `district_surcharges`

Recargos por comuna.

**Responsabilidad**
- Aplicar recargo según zona o comuna.
- Permitir versiones de recargo asociadas a precios.

**Campos clave**
- `pricing_version_id`
- `district_key`
- `surcharge`
- `is_active`

**Relación**
- `district_surcharges.pricing_version_id → pricing_versions.id`

**Estado**
✅ Correcta.

**Mejora recomendada**
Usar `district_key` normalizado en minúscula y sin tildes.

Ejemplo:
- `huechuraba`
- `vitacura`
- `las_condes`
- `providencia`

---

### `offers_or_quotes`

Cotizaciones enviadas al lead.

**Responsabilidad**
- Guardar cotizaciones reales enviadas.
- Mantener trazabilidad del precio, servicio, comuna y versión de precios.
- Permitir followups después de cotización.

**Campos clave**
- `lead_id`
- `price`
- `status`
- `service`
- `vehicle_type`
- `district`
- `base_price`
- `surcharge`
- `pricing_version_id`
- `pricing_snapshot`

**Relación**
- `offers_or_quotes.lead_id → leads.id`

**Estado**
✅ Bien como tabla de cotizaciones.

**Mejora recomendada**
Agregar check de estados:

```sql
alter table public.offers_or_quotes
add constraint offers_or_quotes_status_check
check (
  status in (
    'pending_send',
    'sent',
    'failed',
    'accepted',
    'rejected',
    'expired',
    'booked'
  )
);
```

---

## Módulo D — Agenda y servicio

### `appointments`

Tabla de reservas/citas.

**Responsabilidad**
- Guardar reservas creadas en calendario.
- Relacionar la cita con el lead.
- Guardar estado de cancelación, reprogramación y post-servicio.
- Registrar instrucciones, review y referral.

**Campos clave**
- `event_id`
- `conversation_id`
- `start_at`
- `end_at`
- `summary`
- `description`
- `status`

**Campos de operación**
- `service_address`
- `address_reference`
- `address_confirmed_at`
- `cancelled_at`
- `cancel_reason`
- `rescheduled_at`
- `rescheduled_from_event_id`
- `completed_at`

**Campos de automatización**
- `reminder_7d_sent_at`
- `reminder_1d_sent_at`
- `reminder_1h_sent_at`
- `pre_service_instructions_sent_at`
- `on_the_way_sent_at`
- `review_requested_at`
- `referral_requested_at`

**Relación**
- `appointments.conversation_id → leads.id`

**Estado**
✅ Muy completa para el flujo comercial.

**Mejora recomendada**
Renombrar conceptualmente `conversation_id` a `lead_id` en una futura migración. Ahora funciona, pero semánticamente representa un lead, no una conversación.

Agregar check de estados:

```sql
alter table public.appointments
add constraint appointments_status_check
check (
  status in (
    'pending',
    'confirmed',
    'cancelled',
    'rescheduled',
    'completed',
    'no_show'
  )
);
```

---

### `reminders_sent`

Registro de recordatorios enviados.

**Responsabilidad**
- Evitar duplicar recordatorios.
- Registrar recordatorios por evento y teléfono.

**Campos clave**
- `dedupe_key`
- `event_id`
- `reminder_type`
- `phone`
- `start_datetime`
- `sent_at`

**Estado**
✅ Útil para deduplicación.

**Mejora recomendada**
Unificar tipos de timestamp. Actualmente usa `timestamp without time zone`, mientras otras tablas usan `timestamp with time zone`.

Recomendado:
```sql
sent_at timestamp with time zone not null default now()
```

---

## Módulo E — Followups y automatizaciones comerciales

### `followups`

Tabla de seguimientos automáticos.

**Responsabilidad**
- Programar mensajes futuros.
- Controlar estados de ejecución.
- Evitar duplicados con `dedupe_key`.
- Registrar errores, cancelaciones y completados.

**Campos clave**
- `lead_id`
- `scheduled_for`
- `status`
- `followup_type`
- `message_template_key`
- `metadata`
- `dedupe_key`

**Campos de ejecución**
- `processing_started_at`
- `executed_at`
- `completed_at`
- `failed_at`
- `cancelled_at`
- `skipped_reason`

**Relación**
- `followups.lead_id → leads.id`

**Estado**
✅ Muy buena base para scheduler profesional.

**Mejora recomendada**
Cambiar `executed_at` y `processing_started_at` a `timestamp with time zone` para mantener consistencia.

---

## Módulo F — Handoff humano

### `handoff_cases`

Casos derivados a humano.

**Responsabilidad**
- Registrar cuándo el bot pausa automatización.
- Guardar motivo, resumen, prioridad y responsable.
- Controlar resolución del caso.

**Campos clave**
- `lead_id`
- `status`
- `reason`
- `summary`
- `priority`
- `assigned_to`
- `assigned_team`
- `notified_at`
- `taken_by`
- `resolved_by`
- `metadata`

**Estado**
⚠️ Buena tabla, pero falta foreign key hacia `leads`.

**Mejora recomendada**

```sql
alter table public.handoff_cases
add constraint handoff_cases_lead_id_fkey
foreign key (lead_id)
references public.leads(id)
on delete cascade;
```

Agregar checks:

```sql
alter table public.handoff_cases
add constraint handoff_cases_status_check
check (status in ('open', 'notified', 'taken', 'resolved', 'cancelled'));

alter table public.handoff_cases
add constraint handoff_cases_priority_check
check (priority in ('low', 'normal', 'high', 'urgent'));
```

---

## Módulo G — Auditoría y debugging

### `audit_logs`

Registro técnico y comercial del flujo.

**Responsabilidad**
- Guardar decisiones del sistema.
- Auditar rules engine, LLM y action executor.
- Permitir debug por `idempotency_key`.
- Entender por qué el bot respondió algo.

**Campos clave**
- `flow_name`
- `lead_id`
- `channel`
- `stage_before`
- `latest_user_message`
- `allowed_actions`
- `decision`
- `meta`
- `llm`
- `idempotency_key`

**Estado**
✅ Correcta para debug.

**Mejora recomendada**
Cambiar `lead_id text` a `uuid` en una futura migración.

Ahora está como `text`, mientras `leads.id` es `uuid`. Eso no rompe el sistema, pero reduce integridad referencial.

Futura mejora:

```sql
-- Solo si todos los lead_id son UUID válidos
alter table public.audit_logs
alter column lead_id type uuid using lead_id::uuid;

alter table public.audit_logs
add constraint audit_logs_lead_id_fkey
foreign key (lead_id)
references public.leads(id)
on delete set null;
```

---

## Módulo H — QA y pruebas

### `qa_test_scenarios`

Escenarios de prueba.

**Responsabilidad**
- Guardar escenarios automatizados de QA.
- Permitir suites, prioridad, tags y pasos.

**Campos clave**
- `scenario_key`
- `name`
- `suite`
- `enabled`
- `priority`
- `tags`
- `steps`

**Estado**
✅ Muy útil para regression testing.

---

### `qa_test_results`

Resultados de pruebas QA.

**Responsabilidad**
- Guardar cada paso ejecutado.
- Registrar respuesta del bot.
- Guardar snapshot de estado y auditoría.
- Detectar fallas automáticas.

**Campos clave**
- `run_id`
- `scenario_id`
- `scenario_name`
- `step_index`
- `text_sent`
- `passed`
- `errors`
- `lead_id`
- `state_snapshot`
- `bot_response`
- `audit_snapshot`

**Estado**
✅ Buena tabla para QA.

**Mejora recomendada**
Agregar índice para consultar corridas:

```sql
create index if not exists idx_qa_test_results_run_id
on public.qa_test_results(run_id);

create index if not exists idx_qa_test_results_scenario_id
on public.qa_test_results(scenario_id);
```

---

## Módulo I — Sesiones de test

### `test_chat_sessions`

Sesiones de prueba del chat.

**Responsabilidad**
- Asociar sesiones de test con teléfono asignado.
- Mantener testing separado del canal real.

**Campos clave**
- `chat_session_id`
- `assigned_phone`
- `assigned_name`
- `channel`

**Estado**
✅ Correcta.

---

# 2. Orden recomendado de creación de tablas

Este es el orden correcto por dependencias:

1. `leads`
2. `pricing_versions`
3. `lead_state`
4. `messages`
5. `service_vehicle_prices`
6. `district_surcharges`
7. `offers_or_quotes`
8. `appointments`
9. `followups`
10. `handoff_cases`
11. `audit_logs`
12. `qa_test_scenarios`
13. `qa_test_results`
14. `reminders_sent`
15. `test_chat_sessions`

---

# 3. Mapa relacional simplificado

```text
leads
├── lead_state
├── messages
├── offers_or_quotes
├── appointments
├── followups
└── handoff_cases

pricing_versions
├── service_vehicle_prices
└── district_surcharges

qa_test_scenarios
└── qa_test_results

audit_logs
└── referencia lógica a leads por lead_id

reminders_sent
└── referencia lógica a appointments.event_id

test_chat_sessions
└── usado para pruebas de chat
```

---

# 4. Problemas o inconsistencias detectadas

## 1. `appointments.conversation_id` en realidad representa un lead

No es grave, pero el nombre puede confundir.

**Ideal futuro**
```text
conversation_id → lead_id
```

---

## 2. `audit_logs.lead_id` está como text

Tu `leads.id` es uuid. Esto impide una relación formal segura.

**Ideal futuro**
```text
audit_logs.lead_id uuid
```

---

## 3. `handoff_cases.lead_id` no tiene foreign key

La tabla tiene índice, pero no tiene relación formal con `leads`.

**Corregir recomendado**
```sql
alter table public.handoff_cases
add constraint handoff_cases_lead_id_fkey
foreign key (lead_id)
references public.leads(id)
on delete cascade;
```

---

## 4. Timestamps mezclados

Algunas tablas usan:

```text
timestamp with time zone
```

y otras:

```text
timestamp without time zone
```

Ejemplos:
- `followups.executed_at`
- `followups.processing_started_at`
- `reminders_sent.start_datetime`
- `reminders_sent.sent_at`

**Recomendación**
Usar `timestamp with time zone` para todos los eventos del sistema.

---

## 5. Falta normalización de estados

Varias tablas tienen campos `status text`, pero no todas tienen `check constraints`.

Tablas donde conviene controlar estados:
- `appointments`
- `offers_or_quotes`
- `handoff_cases`
- `messages`
- `lead_state`

---

## 6. `offers_or_quotes` puede mejorar su ciclo comercial

Actualmente guarda la cotización, pero conviene definir estados claros:

```text
pending_send
sent
failed
accepted
rejected
expired
booked
```

Esto permite saber si el cliente aceptó, si se agendó o si quedó pendiente.

---

## 7. `messages.provider_message_id` podría duplicarse

Ya tienes índice, pero no unique.

Si WhatsApp reintenta webhooks, puede duplicar entradas.

**Recomendado**
```sql
create unique index if not exists uq_messages_provider_message_id
on public.messages(provider_message_id)
where provider_message_id is not null;
```

---

# 5. Evaluación general

Tu base de datos está bastante bien armada para un MVP avanzado.

## Lo fuerte

- Tiene `leads` como raíz.
- Tiene `lead_state` como memoria comercial.
- Tiene `messages` para historial.
- Tiene `appointments` bien completa.
- Tiene pricing versionado.
- Tiene followups con dedupe.
- Tiene auditoría.
- Tiene QA interno.
- Tiene handoff humano.
- Está alineada con una arquitectura modular de n8n.

## Lo que falta para dejarla más profesional

1. Estandarizar nombres.
2. Agregar constraints de estados.
3. Agregar foreign key en `handoff_cases`.
4. Normalizar timestamps.
5. Mejorar relación de `audit_logs` con `leads`.
6. Agregar índices de consulta para QA y agenda.
7. Crear vistas útiles para debugging.
8. Separar datos temporales de agenda si el sistema crece mucho.

---

# 6. Vistas recomendadas

## Vista: conversación completa por lead

```sql
create or replace view public.v_lead_conversation as
select
  l.id as lead_id,
  l.phone,
  l.name,
  m.direction,
  m.content,
  m.status,
  m.provider_status,
  m.created_at
from public.leads l
join public.messages m
  on m.lead_id = l.id
order by l.id, m.created_at asc;
```

---

## Vista: estado comercial actual

```sql
create or replace view public.v_lead_current_state as
select
  l.id as lead_id,
  l.phone,
  l.name,
  ls.stage,
  ls.service_interest,
  ls.vehicle_type,
  ls.district,
  ls.next_goal,
  ls.last_bot_action,
  ls.human_handoff,
  ls.updated_at
from public.leads l
left join public.lead_state ls
  on ls.lead_id = l.id;
```

---

## Vista: reservas futuras

```sql
create or replace view public.v_upcoming_appointments as
select
  a.id,
  a.event_id,
  a.conversation_id as lead_id,
  l.phone,
  l.name,
  a.start_at,
  a.end_at,
  a.status,
  a.service_address,
  a.address_reference
from public.appointments a
join public.leads l
  on l.id = a.conversation_id
where a.start_at >= now()
  and a.status in ('pending', 'confirmed')
order by a.start_at asc;
```

---

## Vista: últimos errores QA

```sql
create or replace view public.v_latest_qa_failures as
select
  run_id,
  scenario_id,
  scenario_name,
  step_index,
  text_sent,
  bot_response,
  errors,
  created_at
from public.qa_test_results
where passed = false
order by created_at desc;
```

---

# 7. Conclusión

La base está bien diseñada para un AI Closer comercial. No parece una base improvisada: ya tiene estructura de ventas, agenda, pricing, auditoría, QA y handoff.

El siguiente salto para dejarla más sólida es aplicar integridad:

- constraints
- foreign keys faltantes
- timestamps consistentes
- vistas de debug
- estados comerciales controlados

Con eso, tu base queda mucho más robusta para operar en producción y para seguir conectando los workflows de n8n.