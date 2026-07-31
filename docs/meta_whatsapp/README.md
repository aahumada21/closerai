# Meta WhatsApp Cloud API Multi-Number Package

This package creates a reusable n8n base for Meta WhatsApp Cloud API with multiple phone numbers.

## Workflows

- `whatsapp_register_number`: registers an approved Meta phone number via `POST /{phone_number_id}/register`.
- `whatsapp_webhook_meta`: handles Meta webhook verification (`GET`) and incoming events (`POST`), normalizes messages/statuses, logs the event, and forwards normalized messages to `whatsapp_inbound_router`.

## Environment Variables

Add these to n8n runtime:

```env
META_GRAPH_VERSION=v20.0
META_ACCESS_TOKEN=
META_VERIFY_TOKEN=
DEFAULT_WABA_ID=
DEFAULT_PIN=
```

Do not log or hardcode `META_ACCESS_TOKEN`.

If n8n blocks `$env` in expressions/code nodes, add the variables to your Docker Compose environment and allow node env access according to your n8n runtime policy.

Postgres nodes in `whatsapp_webhook_meta` are exported without credentials on purpose. After creating the workflow, assign your Supabase/Postgres credential in n8n before activating it.

## Database

Run:

```powershell
psql "$env:SUPABASE_DB_URL" -f "db/migrations/20260602_meta_whatsapp_multi_number.sql"
```

Tables:

- `public.whatsapp_numbers`: configured Meta phone numbers.
- `public.whatsapp_webhook_logs`: normalized event/debug log with idempotency.

## Register Number Example

```powershell
$body = @{
  phone_number_id = "123456789012345"
  pin = "123456"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://n8n.example.com/webhook/whatsapp-register-number" `
  -ContentType "application/json" `
  -Body $body
```

Expected success:

```json
{
  "success": true,
  "phone_number_id": "123456789012345",
  "registered_at": "2026-06-02T00:00:00.000Z",
  "raw": {}
}
```

## Webhook Verification

Configure Meta callback URL:

```text
https://YOUR_N8N_DOMAIN/webhook/whatsapp-meta
```

Verify token must match `META_VERIFY_TOKEN`. The GET handler returns `hub.challenge` as plain text.

## Normalized Message Example

```json
{
  "event_type": "message",
  "channel": "whatsapp",
  "waba_id": "123",
  "phone_number_id": "456",
  "display_phone_number": "56900000000",
  "lead_id": "wa_56911111111",
  "from": "56911111111",
  "name": "Cliente",
  "message_id": "wamid.xxx",
  "timestamp": "2026-06-02T00:00:00.000Z",
  "message_type": "text",
  "text": "Hola",
  "idempotency_key": "wa_msg_wamid.xxx",
  "raw": {}
}
```

## Router Contract

`whatsapp_webhook_meta` sends message events to `whatsapp_inbound_router` with:

```json
{
  "source": "meta_whatsapp_cloud_api",
  "normalized_event": {},
  "routing": {
    "phone_number_id": "456",
    "environment": "production"
  }
}
```

## Test Checklist

1. Register approved number with `whatsapp_register_number`.
2. Set Meta webhook URL to `/webhook/whatsapp-meta`.
3. Verify webhook in Meta; response must be plain `hub.challenge`.
4. Send a WhatsApp text message; verify a `message` log in `whatsapp_webhook_logs`.
5. Trigger a status event; verify a `status` log.
6. Add a second row in `whatsapp_numbers`; verify routing by `phone_number_id`.

## Create Workflows In n8n

Use the create script because these are new workflows:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_create_workflow_from_template.ps1 -TemplatePath "workflows/exports/meta_whatsapp/whatsapp_register_number.json" -Category "meta_whatsapp"
powershell -ExecutionPolicy Bypass -File .\scripts\n8n_create_workflow_from_template.ps1 -TemplatePath "workflows/exports/meta_whatsapp/whatsapp_webhook_meta.json" -Category "meta_whatsapp"
```
