# Guia de implementacion omnicanal

Fecha: 2026-06-15  
Objetivo: evolucionar el AI Closer desde WhatsApp-first hacia una capa omnicanal preparada para WhatsApp, Instagram, webchat y futuros canales.

## 1. Objetivo del proyecto

Construir una arquitectura donde cada canal pueda entrar al mismo pipeline core:

```text
Canal externo
→ channel router
→ normalized_event
→ channel_config_resolver
→ lead_loader
→ rules_engine
→ context_builder
→ llm_decision
→ action_executor
→ outbound adapter del canal
```

Principio clave:

- El core no debe saber si el mensaje viene de WhatsApp, Instagram o webchat.
- Cada canal debe normalizar a un contrato comun.
- Cada salida debe usar un adapter especifico del canal.

## 2. Canales objetivo

| Canal | Prioridad | Estado esperado | Uso principal |
|---|---:|---|---|
| WhatsApp Cloud API | P0 | Produccion actual + multiagente robusto | Ventas, agenda, soporte |
| Instagram DM | P1 | Proximo canal | Leads desde redes sociales |
| Webchat | P1 | Proximo canal propio | Leads desde sitio web |
| Facebook Messenger | P2 | Futuro | Leads Meta adicionales |
| Email | P2 | Futuro | Seguimiento y soporte |
| Formularios web | P2 | Futuro | Captura asincronica |

## 3. Contrato comun de entrada

Todos los canales deben emitir este objeto:

```json
{
  "event_type": "message",
  "channel": "whatsapp|instagram|webchat|messenger|email",
  "provider": "meta_whatsapp_cloud_api|instagram_graph_api|webchat_widget",
  "external_channel_id": "",
  "lead_id": "",
  "message_id": "",
  "timestamp": "",
  "message_type": "text|image|audio|document|interactive|unknown",
  "text": "",
  "attachments": [],
  "contact": {
    "external_id": "",
    "name": "",
    "username": "",
    "phone": "",
    "email": ""
  },
  "source_metadata": {
    "provider": "",
    "phone_number_id": "",
    "instagram_business_account_id": "",
    "webchat_widget_id": "",
    "display_name": "",
    "raw_channel": ""
  },
  "routing": {
    "organization_id": null,
    "agent_id": null,
    "environment": "production"
  },
  "raw": {}
}
```

Reglas:

- `channel` identifica el canal funcional.
- `provider` identifica la integracion tecnica.
- `external_channel_id` debe mapear contra `agent_channels.external_channel_id`.
- `lead_id` debe ser estable por usuario/canal.
- `message_id` debe usarse para idempotencia.

## 4. Modelo de datos recomendado

### 4.1 Reusar tablas actuales

Usar estas tablas existentes:

- `organizations`
- `agents`
- `agent_channels`
- `agent_business_config`
- `agent_tools`
- `agent_rules`
- `agent_prompt_templates`
- `agent_knowledge_sources`
- `agent_knowledge_chunks`
- `leads`
- `lead_state`
- `messages`
- `audit_logs`

### 4.2 Extender `agent_channels` (COMPLETADO) 15-06-2026

Campos que debe cubrir `agent_channels.config`:

```json
{
  "environment": "production",
  "inbound_enabled": true,
  "outbound_enabled": true,
  "display_name": "",
  "default_language": "es-CL",
  "provider_credentials_ref": "",
  "rate_limit": {
    "messages_per_minute": 60
  },
  "fallback_policy": {
    "on_error": "handoff_or_retry"
  }
}
```

Ejemplos de `external_channel_id`:

```text
whatsapp: phone_number_id
instagram: instagram_business_account_id
webchat: widget_id o site_id
```

### 4.3 Tabla opcional: `channel_event_logs`  (COMPLETADO) 15-06-2026
Crear si se quiere una auditoria comun para todos los canales:

```sql
create table public.channel_event_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id),
  agent_id uuid null references public.agents(id),
  channel text not null,
  provider text not null,
  external_channel_id text null,
  event_type text not null,
  message_id text null,
  lead_id text null,
  idempotency_key text not null unique,
  normalized_ok boolean not null default false,
  error text null,
  normalized_event jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  event_received_at timestamptz not null default now()
);
```

## 5. Workflows a implementar

### 5.1 `channel_config_resolver`  (COMPLETADO) 15-06-2026

Prioridad: P0.

Input:

```json
{
  "channel": "whatsapp",
  "provider": "meta_whatsapp_cloud_api",
  "external_channel_id": "",
  "lead_id": "",
  "message_id": ""
}
```

Output:

```json
{
  "should_process": true,
  "not_processed_reason": null,
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

Responsabilidad:

- resolver `agent_channels`;
- bloquear canales no configurados;
- bloquear agentes/organizaciones inactivas;
- auditar descarte con reason code.

No debe:

- llamar LLM;
- escribir `lead_state`;
- enviar mensajes.

### 5.2 `whatsapp_inbound_adapter`  (COMPLETADO) 15-06-2026

Prioridad: P0.

Responsabilidad:

- reemplazar o refactorizar `1 Inbound_router` para que solo normalice WhatsApp;
- sacar el filtro hardcodeado de `allowed_phone_number_id`;
- enviar `external_channel_id = phone_number_id`;
- pasar por `channel_config_resolver`.

Eventos soportados:

- mensajes entrantes;
- status `sent`;
- status `delivered`;
- status `read`;
- status `failed`;
- media: audio, image, document.

Implementacion local:

- workflow refactorizado: `workflows/exports/uncategorized/1 - 1 Inbound_router__id-a5202fbc-eded-44b4-a98a-492a742c1368.json`;
- nombre runtime: `1 whatsapp_inbound_adapter`;
- elimina `allowed_phone_number_id`;
- normaliza `external_channel_id = phone_number_id`;
- soporta mensajes, estados `sent|delivered|read|failed` y media `audio|image|document`;
- llama a `2.1 channel_config_resolver`;
- solo continua a `lead_loader` si `should_process=true`;
- los descartes quedan auditados por `channel_config_resolver` en `channel_event_logs`.

### 5.3 `instagram_inbound_adapter`  (TEMPLATE LISTO) 15-06-2026

Prioridad: P1.

Responsabilidad:

- recibir webhook de Instagram Graph API;
- verificar webhook;
- normalizar DMs;
- extraer `instagram_business_account_id`;
- extraer `sender_id`;
- generar `lead_id = ig_<sender_id>`;
- pasar al mismo `channel_config_resolver`.

Output normalizado:

```json
{
  "event_type": "message",
  "channel": "instagram",
  "provider": "instagram_graph_api",
  "external_channel_id": "<instagram_business_account_id>",
  "lead_id": "ig_<sender_id>",
  "message_id": "",
  "text": "",
  "contact": {
    "external_id": "<sender_id>",
    "username": ""
  }
}
```

Pendientes tecnicos:

- configurar app Meta con permisos de Instagram messaging;
- validar webhook GET;
- mapear errores de permisos/token;
- soportar quick replies si aplica.

Implementacion local:

- template versionable: `workflows/templates/instagram_inbound_adapter.json`;
- webhook GET/POST path: `instagram-meta`;
- GET valida `hub.mode`, `hub.verify_token` contra `META_VERIFY_TOKEN` y responde `hub.challenge`;
- POST normaliza DMs desde `entry[].messaging[]`;
- extrae `external_channel_id = entry.id || recipient.id`;
- genera `lead_id = ig_<sender_id>`;
- soporta texto, postback, quick replies, attachments, delivery y read;
- llama a `2.1 channel_config_resolver`;
- continua a `2 lead_loader` solo para `event_type=message` y `should_process=true`.

### 5.4 `webchat_inbound_adapter`  (TEMPLATE LISTO) 16-06-2026

Prioridad: P1.

Responsabilidad:

- recibir eventos del widget web propio;
- validar token o firma;
- normalizar usuario anonimo o identificado;
- generar `lead_id = web_<visitor_id>`;
- usar `external_channel_id = widget_id`;
- pasar por `channel_config_resolver`.

Payload esperado:

```json
{
  "widget_id": "",
  "visitor_id": "",
  "session_id": "",
  "name": "",
  "email": "",
  "phone": "",
  "text": "",
  "page_url": "",
  "utm": {}
}
```

Implementacion local:

- template versionable: `workflows/templates/webchat_inbound_adapter.json`;
- export base: `workflows/exports/webchat/webchat_inbound_adapter.json`;
- guia de conexion: `docs/WEBCHAT_CONNECTION_GUIDE_2026-06-16.md`;
- webhook POST path: `webchat-inbound`;
- valida token via `X-Webchat-Token` o `Authorization: Bearer`;
- usa `WEBCHAT_WIDGET_TOKEN` o `WEBCHAT_SHARED_SECRET`;
- genera `lead_id = web_<visitor_id>` o `web_<session_id>`;
- usa `external_channel_id = widget_id`;
- rechazos se auditan en `channel_event_logs`;
- eventos validos pasan por `2.1 channel_config_resolver`;
- continua a `2 lead_loader` solo si `should_process=true`.

Output normalizado:

```json
{
  "event_type": "message",
  "channel": "webchat",
  "provider": "webchat_widget",
  "external_channel_id": "<widget_id>",
  "lead_id": "web_<visitor_id>",
  "message_id": "",
  "text": "",
  "contact": {
    "external_id": "<visitor_id>",
    "name": "",
    "email": "",
    "phone": ""
  },
  "source_metadata": {
    "page_url": "",
    "utm": {}
  }
}
```

### 5.5 `outbound_message_dispatcher`

Prioridad: P0.

Responsabilidad:

- recibir una orden generica `message.send`;
- decidir adapter outbound segun `channel`;
- ejecutar:
  - `whatsapp_outbound_adapter`;
  - `instagram_outbound_adapter`;
  - `webchat_outbound_adapter`;
- guardar resultado comun.

Input:

```json
{
  "channel": "whatsapp",
  "provider": "meta_whatsapp_cloud_api",
  "lead_id": "",
  "to": "",
  "message": "",
  "attachments": [],
  "idempotency_key": "",
  "routing": {
    "organization_id": "",
    "agent_id": ""
  }
}
```

Output:

```json
{
  "success": true,
  "message_sent": true,
  "provider_message_id": "",
  "provider_status": "sent|failed",
  "provider_error": null,
  "raw": {}
}
```

## 6. Cambios necesarios en workflows actuales

### `1 Inbound_router`

Cambios:

- separar `whatsapp_inbound_adapter`;
- eliminar `SET phone_number_filter_config` como fuente de verdad;
- llamar a `channel_config_resolver`;
- loggear eventos descartados.

### `2 lead_loader`

Cambios:

- mantener soporte agent-aware actual;
- asegurar que `lead_id` sea unico por canal/proveedor;
- evitar mezclar un mismo `external_id` entre canales distintos.

Recomendacion:

```text
channel + provider + lead_id
```

debe formar la identidad logica del lead.

### `4 context_builder`

Cambios:

- incluir `channel` y `provider` en `context_packet.routing`;
- incluir capacidades del canal:

```json
{
  "channel_capabilities": {
    "supports_media": true,
    "supports_buttons": true,
    "supports_templates": true,
    "requires_template_for_outbound_reopen": true
  }
}
```

### `6 action_executor`

Cambios:

- `message.send` debe llamar a `outbound_message_dispatcher`;
- auditar adapter usado;
- auditar provider status;
- no asumir WhatsApp en todas las respuestas.

## 7. Roadmap por fases

### Fase 1 — Contrato omnicanal comun

Entregables:

- definir `normalized_event`;
- crear `channel_config_resolver`;
- crear `channel_event_logs`;
- adaptar QA para validar `channel`, `provider`, `external_channel_id`.

Criterio de salida:

- WhatsApp sigue pasando QA actual.
- Numero no configurado se descarta con auditoria.

### Fase 2 — WhatsApp productivo agent-aware

Entregables:

- refactor de `1 Inbound_router`;
- eliminar filtro hardcodeado;
- resolver agente por `agent_channels`;
- mantener status handling.

Criterio de salida:

- WhatsApp real enruta por `phone_number_id`;
- dos numeros pueden ir a agentes distintos.

### Fase 3 — Webchat

Entregables:

- `webchat_inbound_adapter`;
- `webchat_outbound_adapter`;
- widget o API payload minimo;
- persistencia de session_id/page_url/utm.

Criterio de salida:

- usuario anonimo conversa desde web;
- si deja telefono/email, se actualiza lead;
- agenda/cotizacion funciona igual que WhatsApp.

### Fase 4 — Instagram DM

Entregables:

- `instagram_inbound_adapter`;
- `instagram_outbound_adapter`;
- verificacion webhook Meta;
- mapping de Instagram account a `agent_channels`.

Criterio de salida:

- DM entrante crea lead;
- respuesta se envia por Instagram;
- agente correcto responde segun `instagram_business_account_id`.

### Fase 5 — Unificacion outbound

Entregables:

- `outbound_message_dispatcher`;
- adapters por canal;
- fallback si canal no permite respuesta libre;
- soporte de templates cuando aplique.

Criterio de salida:

- `action_executor` no contiene logica especifica de WhatsApp para enviar mensajes.

## 8. QA minimo omnicanal

### Routing

1. WhatsApp numero A enruta a agente A.
2. WhatsApp numero B enruta a agente B.
3. Instagram cuenta A enruta a agente A.
4. Webchat widget A enruta a agente A.
5. Canal desconocido no procesa y audita descarte.
6. Agente inactivo no procesa y audita descarte.

### Conversacion

7. Mismo usuario en WhatsApp mantiene estado.
8. Mismo usuario en Instagram mantiene estado.
9. Mismo visitante web mantiene estado por session/visitor.
10. Mensajes separados se unen o se procesan sin romper contexto.

### Outbound

11. WhatsApp envia mensaje y audita provider id.
12. Instagram envia DM y audita provider id.
13. Webchat devuelve respuesta por session.
14. Falla de provider no marca mensaje como enviado.
15. Reintento no duplica mensaje.

### Seguridad

16. Webchat rechaza payload sin firma/token.
17. Instagram verify token invalido responde 403.
18. WhatsApp verify token invalido responde 403.
19. No se loggean access tokens.
20. Auditoria no contiene secretos.

## 9. Checklist de implementacion

### DB

- [ ] Crear `channel_event_logs`.
- [ ] Confirmar indices en `agent_channels(provider, external_channel_id)`.
- [ ] Definir provider strings oficiales.
- [ ] Cargar `agent_channels` para WhatsApp, Instagram y webchat.

### Workflows

- [x] Crear `channel_config_resolver`.
- [x] Refactorizar `1 Inbound_router` a `whatsapp_inbound_adapter`.
- [x] Crear `instagram_inbound_adapter`.
- [x] Crear `webchat_inbound_adapter`.
- [ ] Crear `outbound_message_dispatcher`.
- [ ] Crear `instagram_outbound_adapter`.
- [x] Crear `webchat_outbound_adapter` (ya existe, poller simple).
- [x] Ajustar `6 action_executor`/`6.24`/`6.1` para que el envio de WhatsApp use el
  `phone_number_id` resuelto por agente en vez de un numero hardcodeado
  (2026-07-28, ver `project_multi_tenant_isolation.md`).

### QA

- [x] QA WhatsApp agent-aware (`scripts/qa_multi_tenant_isolation_test.ps1`, PASS 4/4).
- [ ] QA Instagram DM.
- [ ] QA webchat.
- [x] QA unknown channel (ya cubierto por `channel_config_resolver`/`1.1 n8n_chat_test_router`).
- [ ] QA inactive agent.
- [x] QA outbound failure por canal (numero saliente correcto verificado, ver harness).
- [ ] QA idempotencia por `message_id`.

### Seguridad

- [ ] Verify token por proveedor.
- [ ] Firma/token para webchat.
- [x] Credentials por tenant/canal — **resuelto 2026-07-28** para WhatsApp
  (`agent_channels.external_channel_id` ya se usaba, ahora tambien se USA de
  verdad en el envio saliente), Google Calendar (OAuth propio del agente,
  patron ya existia en 6.2/6.3/6.4, replicado en 6.6/6.10) y Flow.cl (tabla
  nueva `organization_payment_credentials`, fallback al env global si el
  tenant no tiene cuenta propia). Ver `project_multi_tenant_isolation.md`.
- [ ] No exponer tokens en logs.
- [ ] Rate limit por canal.

## 10. Decisiones pendientes

1. Provider string oficial:
   - `meta_whatsapp_cloud_api` vs `whatsapp_cloud_api`.
2. Identidad cross-channel:
   - separar leads por canal o unificar por telefono/email.
3. Webchat:
   - widget propio simple o integracion con proveedor externo.
4. Instagram:
   - responder siempre por API o derivar a inbox humano bajo ciertas reglas.
5. Outbound:
   - manejar ventanas de conversacion y templates por canal.

## 11. Recomendacion tecnica

No conviene agregar Instagram y webchat directamente al `1 Inbound_router`. Eso crearia un mega workflow.

La estructura correcta es:

```text
whatsapp_inbound_adapter
instagram_inbound_adapter
webchat_inbound_adapter
        ↓
channel_config_resolver
        ↓
lead_loader
        ↓
core AI Closer
        ↓
outbound_message_dispatcher
        ↓
adapter outbound por canal
```

Esto mantiene el core reusable, reduce riesgo y deja el sistema preparado para agregar mas canales sin romper WhatsApp.

# TMP CHAT 
## CHAT 1
### CONVERSACION
Objetivo QA:

Detectar intención
Corregir datos
Cotizar
Recomendar
Agendar
Turno 1

Cliente:

hola cuanto sale lavar un auto

Bot:

Hola 👋 te puedo ayudar. Depende del tamaño del vehículo y el servicio que quieras. ¿Es auto, SUV o camioneta?

Turno 2

Cliente:

es una suv chica creo, es un mazda 3

(Error humano: Mazda 3 no es SUV)

Bot esperado:

Perfecto, gracias. Solo para confirmar, el Mazda 3 normalmente corresponde a auto/hatchback, no SUV. Te cotizo como auto.
¿Buscas lavado normal, interior o algo más completo?

Turno 3

Cliente:

si perdon auto jajaj, quiero dejarlo como nuevo tiene manchas en los asientos

Bot esperado:

Entonces te recomendaría limpieza interior/tapiz más que solo lavado exterior. Te explico las opciones disponibles.

Turno 4

Cliente:

ya cuanto sale y voy mañana

(Falta comuna y horario)

Bot esperado:

El valor es $XX. Para revisar disponibilidad necesito saber en qué comuna estás y qué horario te acomoda mañana.

Turno 5

Cliente:

las condes como 3

Bot esperado:

Perfecto, Las Condes está dentro de cobertura. Revisaré disponibilidad para mañana cerca de las 15:00.

Turno 6

Cliente:

mejor que sea el viernes se me olvido que trabajo

Bot esperado:

Sin problema, cambio la búsqueda al viernes. Te reviso horarios disponibles.

### PREGUNTA
encotnre este problema, deberia decirme algo como: Hola, te puedo ayudar. Depende del tamaño del vehículo y el servicio que quieras. ¿Es auto, SUV o camioneta?  
Respondio
hola cuanto sale lavar un auto

Gracias por escribir a Ahumada Detailing. Te ayudo a elegir el servicio ideal para tu auto.

Tenemos 3 opciones:

Lavado basico: mantencion rapida para dejarlo limpio por dentro y fuera.
Lavado premium: limpieza mas completa y detallada, ideal si viene bien sucio o quieres un resultado mas pro.
Encerado full: proteccion y brillo para la pintura.
Cual te interesa? Si no estas seguro, cuentame como esta tu auto y te recomiendo uno



### Detalles 
/numero 56990000206
1.1 n8n_chat_test_router


# errores


# ERORES CORREGIDOS
## ERROR 1
camino del roble 1251 casaa 34

Perfecto, dejo registrada la direccion: camino del roble 1251 casaa 34. Quieres que confirme la reserva ahora para el null a las null?

si

Tengo estos horarios disponibles para lavado premium durante los proximos dias:

jueves, 18-06 a las 09:00 a. m.
domingo, 21-06 a las 09:00 a. m.
martes, 23-06 a las 09:00 a. m.
Cual te acomoda? Puedes responder con 1, 2 o 3.

arregla el error de null a las null... dado este error ademas perdio el confirmar y decir si, se va a mandar los horarios denuevo
## ERORR 2 

/numero 56990000209
/numero 56990000210
/numero 56990000211
/numero 56990000212
/numero 56990000213
/numero 56990000214
/numero 56990000215
/numero 56990000216









cuando confirma puedo confirmar con numero como dice, el dia y la fecha deberia tener estas 3 opciones 

hola cuanto sale lavar un auto

Hola, te ayudo con el valor.

Para enviarte la lista de precios de los 3 servicios necesito 2 datos:

Que vehiculo tienes: auto, SUV o camioneta?
En que comuna seria el servicio?
Con eso te mando los valores de lavado basico, lavado premium y encerado full. Si alguno te acomoda, despues vemos horarios.

estoy en huechuraba, tengo un suv

Gracias por escribir a Ahumada Detailing. Te ayudo a elegir el servicio ideal para tu auto.

Tenemos 3 opciones:

Lavado basico: mantencion rapida para dejarlo limpio por dentro y fuera.
Lavado premium: limpieza mas completa y detallada, ideal si viene bien sucio o quieres un resultado mas pro.
Encerado full: proteccion y brillo para la pintura.
Cual te interesa? Si no estas seguro, cuentame como esta tu auto y te recomiendo uno.