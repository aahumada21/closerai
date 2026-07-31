# Guia de conexion Webchat

Fecha: 2026-06-16

## Objetivo

Conectar un widget web propio al pipeline omnicanal:

```text
webchat widget
-> webchat_inbound_adapter
-> channel_config_resolver
-> lead_loader
-> rules/context/LLM/action_executor
```

## Workflow

Archivo:

```text
workflows/exports/webchat/webchat_inbound_adapter.json
```

Template:

```text
workflows/templates/webchat_inbound_adapter.json
```

Webhook esperado:

```text
POST https://n8n.aahumada.com/webhook/webchat-inbound
```

## Variables de entorno

Agregar al entorno de n8n:

```env
WEBCHAT_WIDGET_TOKEN=<token_largo_y_privado>
```

Alternativa compatible:

```env
WEBCHAT_SHARED_SECRET=<token_largo_y_privado>
```

Regla: si no existe token configurado, el adapter rechaza el evento con `missing_webchat_token_config`.

## Seguridad

El widget debe enviar uno de estos mecanismos:

Header recomendado:

```http
X-Webchat-Token: <WEBCHAT_WIDGET_TOKEN>
```

Alternativa:

```http
Authorization: Bearer <WEBCHAT_WIDGET_TOKEN>
```

Tambien soporta `token` en query/body, pero no se recomienda en produccion porque puede quedar en logs o URLs.

Pendiente para version mas estricta:

- HMAC con firma `X-Webchat-Signature`.
- Requiere conservar raw body exacto en n8n.

## Payload requerido

```json
{
  "widget_id": "site-main",
  "visitor_id": "visitor-123",
  "session_id": "session-456",
  "name": "Nombre Cliente",
  "email": "cliente@example.com",
  "phone": "+56912345678",
  "text": "Hola, quiero cotizar",
  "page_url": "https://sitio.cl/servicios",
  "utm": {
    "source": "google",
    "campaign": "brand"
  }
}
```

Campos minimos:

- `widget_id`
- `visitor_id` o `session_id`
- `text`

## Output normalizado

```json
{
  "event_type": "message",
  "channel": "webchat",
  "provider": "webchat_widget",
  "external_channel_id": "site-main",
  "widget_id": "site-main",
  "lead_id": "web_visitor-123",
  "message_id": "web_site-main_visitor-123_<hash>_<timestamp>",
  "text": "Hola, quiero cotizar",
  "contact": {
    "external_id": "visitor-123",
    "visitor_id": "visitor-123",
    "session_id": "session-456",
    "name": "Nombre Cliente",
    "email": "cliente@example.com",
    "phone": "+56912345678"
  },
  "source_metadata": {
    "provider": "webchat_widget",
    "external_channel_id": "site-main",
    "widget_id": "site-main",
    "visitor_id": "visitor-123",
    "session_id": "session-456",
    "page_url": "https://sitio.cl/servicios",
    "utm": {}
  }
}
```

## Configurar canal en DB

`external_channel_id` debe ser igual a `widget_id`.

```sql
insert into public.agent_channels (
  organization_id,
  agent_id,
  channel,
  provider,
  external_channel_id,
  display_name,
  is_active,
  config
)
values (
  '<organization_id>'::uuid,
  '<agent_id>'::uuid,
  'webchat',
  'webchat_widget',
  'site-main',
  'Webchat sitio principal',
  true,
  '{
    "environment": "production",
    "inbound_enabled": true,
    "outbound_enabled": true,
    "display_name": "Webchat sitio principal",
    "default_language": "es-CL",
    "rate_limit": { "messages_per_minute": 60 },
    "fallback_policy": { "on_error": "handoff_or_retry" }
  }'::jsonb
)
on conflict (provider, external_channel_id)
do update set
  organization_id = excluded.organization_id,
  agent_id = excluded.agent_id,
  channel = excluded.channel,
  display_name = excluded.display_name,
  is_active = true,
  config = excluded.config,
  updated_at = now();
```

## Ejemplo de envio desde frontend

```js
await fetch("https://n8n.aahumada.com/webhook/webchat-inbound", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Webchat-Token": WEBCHAT_WIDGET_TOKEN
  },
  body: JSON.stringify({
    widget_id: "site-main",
    visitor_id: localStorage.getItem("visitor_id"),
    session_id: sessionStorage.getItem("session_id"),
    name: "",
    email: "",
    phone: "",
    text: messageText,
    page_url: window.location.href,
    utm: {
      source: new URLSearchParams(location.search).get("utm_source"),
      campaign: new URLSearchParams(location.search).get("utm_campaign")
    }
  })
});
```

## Reglas de rechazo

El adapter rechaza y audita en `channel_event_logs` si ocurre:

- `missing_webchat_token_config`
- `invalid_webchat_token`
- `missing_widget_id`
- `missing_visitor_or_session_id`
- `missing_text`

El `channel_config_resolver` rechaza y audita si:

- `agent_channel_not_found`
- `agent_channel_inactive`
- `agent_inactive`
- `organization_inactive`
- `channel_inbound_disabled`

## Checklist de prueba

1. `WEBCHAT_WIDGET_TOKEN` existe en Docker/n8n.
2. Workflow `webchat_inbound_adapter` creado y activo.
3. Workflow `2.1 channel_config_resolver` activo.
4. Existe `agent_channels` para `provider='webchat_widget'` y `external_channel_id='<widget_id>'`.
5. Enviar payload con header `X-Webchat-Token`.
6. Verificar `channel_event_logs`:

```sql
select
  event_received_at,
  event_type,
  channel,
  provider,
  external_channel_id,
  lead_id,
  normalized_ok,
  error
from public.channel_event_logs
where channel = 'webchat'
order by event_received_at desc
limit 20;
```

7. Verificar que se cree/actualice lead:

```sql
select id, channel, external_id, phone, name, organization_id, agent_id, updated_at
from public.leads
where channel = 'webchat'
order by updated_at desc
limit 20;
```

## QA automatizado

Script:

```text
scripts/qa_webchat_inbound_adapter.ps1
```

Validacion estatica del export:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa_webchat_inbound_adapter.ps1 -SkipLive
```

Validacion live contra n8n y DB:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa_webchat_inbound_adapter.ps1
```

Variables requeridas para live:

- `SUPABASE_DB_URL`
- `N8N_API_URL` o `N8N_BASE_URL`
- `WEBCHAT_WIDGET_TOKEN` o `WEBCHAT_SHARED_SECRET`

Resultado:

```text
QA/results/qa_webchat_inbound_adapter_472.json
```

## Pendientes antes de produccion

- Definir si el widget usara solo token o HMAC.
- Agregar CORS si el dominio del widget lo requiere en n8n/proxy.
- Definir persistencia de `visitor_id` y `session_id`.
- Definir respuesta outbound hacia el widget: polling, websocket o endpoint propio.
- Agregar rate limit real por `widget_id` e IP.
