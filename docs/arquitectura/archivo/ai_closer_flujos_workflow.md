# AI Closer en n8n — Definición de flujos del workflow

## Objetivo general

Este documento define qué debe hacer cada flujo principal dentro de la arquitectura del AI Closer en n8n, siguiendo una estructura modular, mantenible y escalable.

La lógica del sistema se basa en esta separación:

- **n8n** = orquestación y ejecución
- **Base de datos** = estado, memoria y fuente de verdad
- **LLM** = decisión acotada
- **Reglas duras** = lógica determinística fuera de la IA

---

# Vista general de flujos

1. `whatsapp_inbound_router` * 
2. `lead_loader` * 
3. `rules_engine`
4. `context_builder`
5. `llm_decision`
6. `action_executor`
7. `followup_scheduler`
8. `human_handoff`
9. `analytics_audit`

---

# 1. Flow: `whatsapp_inbound_router`

## Propósito
Recibir eventos entrantes desde WhatsApp API, validar que sean útiles para el sistema y normalizarlos a un formato común.

## Qué debe hacer
- Recibir el webhook de Meta/WhatsApp.
- Validar la suscripción del webhook cuando corresponda.
- Detectar si el evento corresponde a:
  - mensaje entrante de usuario
  - estado de mensaje
  - evento no relevante
- Ignorar eventos que no requieran procesamiento comercial.
- Extraer los datos útiles del mensaje.
- Transformar el payload original a un objeto normalizado.
- Enviar el evento normalizado al siguiente flujo.

## Entrada esperada
Payload crudo de WhatsApp API.

## Salida esperada
```json
{
  "channel": "whatsapp",
  "lead_id": "56949186386",
  "message_id": "wamid_xxx",
  "timestamp": "2026-04-13T15:00:00Z",
  "text": "Hola, cuánto sale el lavado premium",
  "attachments": [],
  "source_metadata": {
    "raw_type": "whatsapp_cloud_api"
  }
}
```

## Reglas importantes
- No ejecutar lógica comercial aquí.
- No llamar al LLM.
- No decidir respuestas aquí.
- Este flujo solo recibe, filtra y normaliza.

## Nodos típicos en n8n
- Webhook
- IF / Switch
- Code
- Set
- Execute Workflow

---

# 2. Flow: `lead_loader`

## Propósito
Buscar o crear el lead en la base de datos y cargar su estado actual, memoria útil y datos relacionados.

## Qué debe hacer
- Buscar si el `lead_id` ya existe.
- Si no existe, crear registro inicial del lead.
- Cargar:
  - datos básicos del lead
  - estado comercial actual
  - resumen conversacional útil
  - historial mínimo reciente si hace falta
  - reglas comerciales necesarias
- Crear un `lead_state` inicial si no existe.

## Entrada esperada
Evento normalizado del router.

## Salida esperada
```json
{
  "event": {},
  "lead": {
    "id": "lead_001",
    "phone": "56949186386",
    "name": null,
    "created_at": "2026-04-13T15:00:00Z"
  },
  "lead_state": {
    "stage": "new_lead",
    "intent_last": null,
    "interest_score": 0,
    "service_interest": null,
    "vehicle_type": null,
    "district": null,
    "missing_fields": [],
    "last_bot_action": null,
    "next_goal": "qualify_lead",
    "human_handoff": false
  },
  "memory": {
    "short_summary": "",
    "commercial_flags": []
  }
}
```

## Reglas importantes
- La base de datos debe ser la fuente de verdad.
- No confiar en memoria temporal de n8n como estado principal.
- No responder todavía al cliente.

## Tablas mínimas sugeridas
- `leads`
- `lead_state`
- `messages`
- `offers_or_quotes`
- `appointments`
- `followups`

## Nodos típicos en n8n
- Postgres / Supabase
- IF
- Code
- Merge
- Execute Workflow

---

# 3. Flow: `rules_engine`

## Propósito
Aplicar lógica dura antes de decidir si es necesario usar IA.

## Qué debe hacer
- Analizar si el caso puede resolverse con reglas.
- Detectar datos faltantes obligatorios.
- Detectar intenciones directas y flujos especiales.
- Evitar llamadas innecesarias al LLM.
- Decidir si:
  - pedir dato faltante
  - cotizar directamente
  - responder con regla fija
  - derivar a flujo especial
  - pasar al flujo de IA

## Casos que debe manejar
- Falta comuna.
- Falta tipo de vehículo.
- Falta servicio.
- Usuario quiere agendar.
- Usuario quiere cancelar.
- Usuario ya tiene cita.
- Usuario pregunta algo directo con respuesta fija.
- Usuario escribe fuera de horario.
- Usuario pide hablar con humano.

## Salida esperada
```json
{
  "resolution_type": "rule_based",
  "action": "ask_missing_data",
  "message": "Perfecto. Para cotizarte bien, ¿en qué comuna estás?",
  "state_update": {
    "missing_fields": ["district"],
    "next_goal": "collect_district"
  }
}
```

o bien:

```json
{
  "resolution_type": "send_to_llm",
  "reason": "El mensaje requiere interpretación y manejo comercial."
}
```

## Reglas importantes
- Aquí vive la lógica crítica y determinística.
- No dejar que la IA tome decisiones obvias.
- Preguntar solo un dato faltante por turno si eso mejora la conversión.

## Nodos típicos en n8n
- Switch
- IF
- Code
- Set

---

# 4. Flow: `context_builder`  

## Propósito
Construir un paquete de contexto limpio, corto y útil para el modelo.

## Qué debe hacer
- Tomar la información del lead, estado, memoria y negocio.
- Reducir el contexto a lo necesario para el siguiente turno.
- Incluir acciones permitidas según el estado actual.
- Excluir historial irrelevante o excesivo.

## Qué debe incluir
- Datos básicos del lead
- Estado comercial actual
- Último mensaje del usuario
- Resumen corto
- Reglas del negocio
- Datos de cotización o agenda si aplica
- Lista de acciones permitidas

## Salida esperada
```json
{
  "lead": {
    "name": "Pedro",
    "channel": "whatsapp"
  },
  "state": {
    "stage": "objection",
    "intent_last": "price_objection",
    "interest_score": 82,
    "next_goal": "book_appointment"
  },
  "business": {
    "services": ["lavado_premium", "encerado_full"],
    "pricing_policy": "usar tabla vigente",
    "district_policy": "recargo fuera de zona"
  },
  "conversation": {
    "latest_user_message": "muy caro",
    "short_summary": "preguntó precio, se le cotizó lavado premium para SUV en Huechuraba"
  },
  "allowed_actions": [
    "answer_objection",
    "offer_booking",
    "ask_one_clarifying_question",
    "handoff_human"
  ]
}
```

## Reglas importantes
- No mandar historial completo salvo excepción.
- No mandar información duplicada.
- No incluir campos innecesarios.
- El contexto debe ser pequeño y estable.

## Nodos típicos en n8n
- Code
- Set
- Merge

---

# 5. Flow: `llm_decision`

## Propósito
Llamar al modelo solo cuando el caso realmente lo requiere y obtener una salida estructurada.

## Qué debe hacer
- Enviar el `context_packet` al modelo.
- Instruir al modelo para responder únicamente con JSON válido.
- Pedir una sola acción principal por turno.
- Obtener:
  - acción
  - motivo
  - mensaje
  - actualización de estado
  - confianza

## Salida esperada
```json
{
  "action": "answer_objection",
  "reason": "El usuario objeta precio luego de recibir cotización.",
  "message": "Entiendo. En tu caso el valor incluye atención a domicilio y limpieza profunda interior y exterior. ¿Te gustaría que revisemos un horario para esta semana?",
  "state_update": {
    "stage": "closing",
    "next_goal": "book_appointment"
  },
  "confidence": 0.91
}
```

## Reglas importantes
- La salida debe ser validable.
- El modelo no debe inventar acciones fuera de whitelist.
- No debe ejecutar nada directamente.
- No debe acceder libremente a herramientas.

## Nodos típicos en n8n
- HTTP Request o nodo OpenAI
- Code para parsear JSON
- IF de validación

---

# 6. Flow: `action_executor`

## Propósito
Ejecutar la acción decidida luego de validarla.

## Qué debe hacer
- Validar que la acción esté permitida.
- Validar que existan los datos necesarios.
- Enviar el mensaje al canal correcto.
- Guardar mensaje saliente en la base de datos.
- Actualizar el estado del lead.
- Registrar cotizaciones, citas o seguimientos si aplica.

## Acciones posibles
- `ask_missing_data`
- `send_quote`
- `answer_question`
- `answer_objection`
- `offer_booking`
- `confirm_booking`
- `schedule_followup`
- `handoff_human`

## Ejemplos de ejecución
### Si la acción es `send_quote`
- calcular o leer precio
- generar mensaje
- guardar cotización
- responder por WhatsApp
- actualizar `stage = quoted`

### Si la acción es `confirm_booking`
- crear evento o reserva
- guardar cita
- enviar confirmación
- actualizar `stage = booked`

## Reglas importantes
- Nunca ejecutar acciones sin validación previa.
- Aplicar idempotencia para no duplicar reservas o mensajes.
- Guardar logs de cada ejecución.

## Nodos típicos en n8n
- Switch
- HTTP Request
- Postgres / Supabase
- Calendar
- WhatsApp API

---

# 7. Flow: `followup_scheduler`

## Propósito
Programar seguimientos automáticos y reactivaciones comerciales.

## Qué debe hacer
- Detectar cuándo corresponde hacer seguimiento.
- Crear registros de follow-up pendientes.
- Programar mensajes según reglas de negocio.
- Evitar seguimiento si:
  - ya respondió
  - ya reservó
  - pidió no ser contactado
  - fue derivado a humano

## Casos típicos
- Cotización enviada pero sin respuesta.
- Cliente interesado que desapareció.
- Cliente antiguo para reactivación.
- Recordatorio previo a cita.
- Solicitud de reseña post servicio.

## Salida esperada
Registro en tabla `followups` con fecha, tipo y estado.

## Reglas importantes
- Los follow-ups no deben depender solo de timers internos de n8n.
- Idealmente deben guardarse en DB y ejecutarse por consulta programada.
- Respetar ventanas horarias.

## Nodos típicos en n8n
- Cron
- Postgres / Supabase
- IF
- Execute Workflow

---

# 8. Flow: `human_handoff`

## Propósito
Derivar la conversación a una persona cuando el caso lo requiera.

## Qué debe hacer
- Detectar necesidad de derivación.
- Marcar el lead como `human_handoff = true`.
- Pausar o limitar automatización.
- Notificar al humano responsable.
- Entregar contexto resumido del caso.

## Casos típicos
- Usuario pide humano explícitamente.
- Reclamo delicado.
- Caso complejo fuera de reglas.
- Baja confianza del modelo.
- Error repetido del sistema.

## Salida esperada
```json
{
  "handoff": true,
  "assigned_to": "agente_humano",
  "summary": "Lead consultó por lavado premium, luego reclamó por demora y pidió hablar con una persona."
}
```

## Reglas importantes
- No seguir automatizando como si nada después del handoff.
- Dejar trazabilidad clara.
- Permitir retomar automatización si el humano libera el caso.

## Nodos típicos en n8n
- Postgres / Supabase
- WhatsApp / Chatwoot / Email / Slack
- Set

---

# 9. Flow: `analytics_audit`

## Propósito
Registrar decisiones, errores, eventos y métricas del sistema.

## Qué debe hacer
- Guardar cada mensaje entrante y saliente.
- Registrar cambios de estado.
- Registrar decisiones del rules engine.
- Registrar decisiones del LLM.
- Guardar errores técnicos.
- Medir rendimiento comercial.

## Métricas sugeridas
- tiempo de primera respuesta
- tasa de cotización
- tasa de agendamiento
- tasa de cierre
- tasa de handoff a humano
- tasa de no respuesta
- tasa de error
- costo por conversación
- costo por cierre

## Reglas importantes
- Todo debe quedar auditable.
- Permitir debug por lead, por conversación y por ejecución.
- Separar logs técnicos de métricas comerciales cuando sea necesario.

## Nodos típicos en n8n
- Postgres / Supabase
- Code
- Execute Workflow

---

# Orden recomendado de implementación

## Fase 1 — Base operativa mínima
Implementar primero:
1. `whatsapp_inbound_router`
2. `lead_loader`
3. `rules_engine`
4. `action_executor`

Con esto ya puedes:
- recibir mensajes
- identificar leads
- guardar estado
- pedir datos faltantes
- responder por reglas

## Fase 2 — Inteligencia controlada
Luego implementar:
5. `context_builder`
6. `llm_decision`

Con esto ya puedes:
- manejar objeciones
- responder casos menos estructurados
- avanzar al cierre de forma más inteligente

## Fase 3 — Escalabilidad comercial
Después implementar:
7. `followup_scheduler`
8. `human_handoff`
9. `analytics_audit`

Con esto ya puedes:
- hacer seguimiento automático
- derivar casos complejos
- medir rendimiento real del closer

---

# MVP recomendado para Ahumada Detailing

## Primer caso comercial real
Construir primero el flujo para este escenario:

**Usuario pregunta por precio de un servicio**

### Secuencia ideal
1. Entra mensaje por WhatsApp.
2. Se normaliza.
3. Se busca o crea lead.
4. Se revisa si falta:
   - comuna
   - tipo de vehículo
   - servicio
5. Si falta un dato, se pregunta uno solo.
6. Si están todos los datos, se calcula cotización.
7. Se envía cotización.
8. Se ofrece agendar.
9. Se actualiza estado.

## Resultado
Este MVP ya funciona como un closer básico real y comercialmente útil.

---

# Recomendaciones finales de arquitectura

- No construir un workflow gigante.
- Separar cada responsabilidad en flujos específicos.
- Mantener la base de datos como fuente de verdad.
- Usar IA solo cuando aporte valor real.
- Validar siempre antes de ejecutar.
- Mantener JSONs claros de entrada y salida.
- Diseñar cada flujo para debugging fácil.
- Dejar trazabilidad en cada decisión.

---

# Siguiente documento recomendado

Después de este archivo, el siguiente paso ideal es crear:

1. `state_machine.md`
2. `db_schema.md`
3. `rules_engine_cases.md`
4. `context_packet_spec.md`
5. `llm_output_schema.md`
6. `n8n_node_map.md`

TOKEN PERMAMNTENTE : EAASP3nLrIZAEBRAUI5yjB51Heq3ci7qHVmzCdgmT18bbITAXufR98A0iSJQ699SJMxWVuz8xx6X7uF05cGCMBeBGpd2oyl8O1br1tptJ4DqgmARMnYGua4Rt90ruz6FCf02e9ClYqfF7sfyATfqxo7DHFOw802abZCmdRQwcStoOT2Wc2NcE8t6zHFegZDZD
: EAASP3nLrIZAEBRF8RzNRRRWGJpmKygrOTcZBb2bZCTomMonZBvLKTZBtqcnKSHBqRyzo73dpfVZAyUo7gu9RT56E3vJ9UkeTSC03v0btwIcUZAwAjuvPFIDzksemZBgQIFA7OBxf4hdSXha0kPHP2ZAwZCeUfDjJ2CagWz6ZBoXZApU1bPJzb7JRT6Xd12Rm5oWZCfQZDZD

curl -X POST "https://graph.facebook.com/v23.0/1024332077436840/messages" \
  -H "Authorization: Bearer EAASP3nLrIZAEBRKDNah10diLaZBGRln6XfSaNMB5RZCN3FXPvzpwGJWT14hDH3YR9hfvcDg59G4cZBBLeZAZBPYi5HXjvoM5IaoMIwoYphnlQ0dzJpnlZAGBHG3ST16SVd6dGtsZBTfy3LgRkMQBDiJMieL0MJHgKg1No5V0QyTNULNkqDOZCC3iIAs7uEz38wwZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "569XXXXXXXX",
    "type": "text",
    "text": {
      "body": "Hola, prueba desde token permanente"
    }
  }'


    curl -X GET "https://graph.facebook.com/v23.0/1024332077436840" \
    -H "Authorization: Bearer EAASP3nLrIZAEBRKDNah10diLaZBGRln6XfSaNMB5RZCN3FXPvzpwGJWT14hDH3YR9hfvcDg59G4cZBBLeZAZBPYi5HXjvoM5IaoMIwoYphnlQ0dzJpnlZAGBHG3ST16SVd6dGtsZBTfy3LgRkMQBDiJMieL0MJHgKg1No5V0QyTNULNkqDOZCC3iIAs7uEz38wwZDZD"


  curl -i -X POST `
  https://graph.facebook.com/v25.0/1024332077436840/messages ` 
  -H 'Authorization: Bearer EAASP3nLrIZAEBRKDNah10diLaZBGRln6XfSaNMB5RZCN3FXPvzpwGJWT14hDH3YR9hfvcDg59G4cZBBLeZAZBPYi5HXjvoM5IaoMIwoYphnlQ0dzJpnlZAGBHG3ST16SVd6dGtsZBTfy3LgRkMQBDiJMieL0MJHgKg1No5V0QyTNULNkqDOZCC3iIAs7uEz38wwZDZD' `
  -H 'Content-Type: application/json' `
  -d '{ \"messaging_product\": \"whatsapp\", \"to\": \"\", \"type\": \"template\", \"template\": { \"name\": \"hello_world\", \"language\": { \"code\": \"en_US\" } } }'


 -- =========================
-- LEADS
-- =========================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  external_id text not null,
  phone text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_channel_external_id_uidx
on public.leads (channel, external_id);

-- =========================
-- LEAD STATE
-- =========================
create table if not exists public.lead_state (
  lead_id uuid primary key references leads(id) on delete cascade,
  stage text not null default 'new_lead',
  intent_last text,
  interest_score integer not null default 0,
  service_interest text,
  vehicle_type text,
  district text,
  missing_fields jsonb not null default '[]'::jsonb,
  last_bot_action text,
  next_goal text,
  human_handoff boolean not null default false,
  updated_at timestamptz not null default now()
);

-- =========================
-- MESSAGES
-- =========================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  direction text not null, -- inbound | outbound
  channel text not null,
  message_type text default 'text',
  content text,
  provider_message_id text,
  provider_status text,
  status text not null default 'sent',
  created_at timestamptz default now()
);

create index if not exists idx_messages_lead_id
on public.messages (lead_id);

create index if not exists idx_messages_provider_id
on public.messages (provider_message_id);

create index if not exists idx_messages_lead_created
on public.messages (lead_id, created_at desc);

-- =========================
-- OFFERS / QUOTES
-- =========================
create table if not exists public.offers_or_quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  price numeric,
  status text,
  created_at timestamptz default now()
);

-- =========================
-- APPOINTMENTS (AGENDA REAL)
-- =========================
create table if not exists public.appointments (
  id bigserial primary key,
  event_id text not null unique,
  conversation_id uuid not null references leads(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  summary text,
  description text,
  status text default 'confirmed',

  reminder_7d_sent_at timestamptz,
  reminder_1d_sent_at timestamptz,
  reminder_1h_sent_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_appointments_conversation
on public.appointments (conversation_id);

create index if not exists idx_appointments_start
on public.appointments (start_at);

-- =========================
-- FOLLOWUPS
-- =========================
create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  scheduled_for timestamptz,
  status text default 'pending',
  created_at timestamptz default now()
);

-- =========================
-- AUDIT LOGS (COMPLETO)
-- =========================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  flow_name text not null,
  lead_id uuid references leads(id) on delete set null,
  channel text,

  stage_before text,
  latest_user_message text,

  allowed_actions jsonb default '[]'::jsonb,
  decision jsonb,
  meta jsonb,
  llm jsonb,

  -- ejecución
  action text,
  status text, -- success | error | skipped
  message_sent boolean,
  state_updated boolean,
  execution_id text,
  notes jsonb default '[]'::jsonb,

  -- idempotencia
  idempotency_key text,

  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_idempotency_key
on public.audit_logs (idempotency_key);

create unique index if not exists uq_audit_logs_idempotency_key
on public.audit_logs (idempotency_key);