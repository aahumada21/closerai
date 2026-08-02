# Grafo de dependencias entre workflows

> **Generado** por `node scripts/extract_workflow_code.js`. No editar a mano.

Cada flecha es un nodo `executeWorkflow` (un workflow llamando a otro). Se excluyen los workflows aislados, que se listan aparte mas abajo.

```mermaid
graph LR
  n312077686174["1 whatsapp_inbound_adapter"]
  n32206c656164["2 lead_loader"]
  n312077686174 --> n32206c656164
  n322e31206368["2.1 channel_config_resolver"]
  n312077686174 --> n322e31206368
  n312e31206e38["1.1 n8n_chat_test_router"]
  n312e31206e38 --> n32206c656164
  n332072756c65["3 rules_engine"]
  n32206c656164 --> n332072756c65
  n3420636f6e74["4 context_builder"]
  n332072756c65 -->|2| n3420636f6e74
  n35206c6c6d5f["5 llm_decision"]
  n332072756c65 --> n35206c6c6d5f
  n362061637469["6 action_executor"]
  n332072756c65 -->|2| n362061637469
  n362e31302072["6.10 reschedule_booking"]
  n362061637469 --> n362e31302072
  n362e31312063["6.11 collect_address"]
  n362061637469 --> n362e31312063
  n362e31322063["6.12 confirm_address"]
  n362061637469 --> n362e31322063
  n362e31332073["6.13 send_pre_service_instruction"]
  n362061637469 --> n362e31332073
  n362e3134206e["6.14 notify_on_the_way"]
  n362061637469 --> n362e3134206e
  n362e31352072["6.15 request_review"]
  n362061637469 --> n362e31352072
  n362e31362072["6.16 request_referral"]
  n362061637469 --> n362e31362072
  n362e31372073["6.17 send_service_menu"]
  n362061637469 --> n362e31372073
  n362e31382072["6.18 recommend_service"]
  n362061637469 --> n362e31382072
  n362e31392061["6.19 answer_objection"]
  n362061637469 --> n362e31392061
  n362e32206368["6.2 check_calendar_slot"]
  n362061637469 --> n362e32206368
  n362e3230206f["6.20 offer_booking"]
  n362061637469 --> n362e3230206f
  n362e32312073["6.21 schedule_followup"]
  n362061637469 --> n362e32312073
  n362e32322068["6.22 handoff_human"]
  n362061637469 --> n362e32322068
  n362e3233206f["6.23 offer_available_slots"]
  n362061637469 --> n362e3233206f
  n362e32342070["6.24 persist_and_audit"]
  n362061637469 --> n362e32342070
  n362e32352061["6.25 ask_payment_preference"]
  n362061637469 --> n362e32352061
  n362e32362070["6.26 payment_request"]
  n362061637469 --> n362e32362070
  n362e32382063["6.28 check_payment_status"]
  n362061637469 --> n362e32382063
  n362e33206372["6.3 create_calendar_booking"]
  n362061637469 --> n362e33206372
  n362e3520636f["6.5 confirm_booking_executor"]
  n362061637469 --> n362e3520636f
  n362e36206361["6.6 cancel_booking"]
  n362061637469 --> n362e36206361
  n362e37206173["6.7 ask_missing_data"]
  n362061637469 --> n362e37206173
  n362e38207365["6.8 send_quote"]
  n362061637469 --> n362e38207365
  n362e3920616e["6.9 answer_question"]
  n362061637469 --> n362e3920616e
  n362e31302072 --> n362e32206368
  n362e34206c69["6.4 list_available_slots"]
  n362e31302072 --> n362e34206c69
  n6765745f7661["get_valid_calendar_token"]
  n362e31302072 --> n6765745f7661
  n362e32206368 --> n6765745f7661
  n382e30206875["8.0 human_handof"]
  n362e32322068 --> n382e30206875
  n362e3233206f --> n362e32206368
  n362e3233206f --> n362e34206c69
  n362e31207365["6.1 send_outbound_message"]
  n362e32342070 --> n362e31207365
  n362e32362070 -->|2| n362e31207365
  n362e32372070["6.27 payment_confirmed_webhook"]
  n362e32372070 -->|2| n362e31207365
  n362e32372070 --> n362e3520636f
  n362e32392072["6.29 release_expired_payment_holds"]
  n362e32392072 -->|2| n362e31207365
  n362e33206372 --> n6765745f7661
  n362e34206c69 --> n6765745f7661
  n362e3520636f --> n362e31332073
  n362e3520636f --> n362e32206368
  n362e3520636f --> n362e33206372
  n362e36206361 --> n362e3233206f
  n362e36206361 --> n6765745f7661
  n362e30207265["6.0 resolve_pricing_from_db"]
  n362e38207365 --> n362e30207265
  n3720666f6c6c["7 followup_scheduler"]
  n3720666f6c6c --> n362e31207365
  n392e30207161["9.0 qa_whatsapp_normalized_router"]
  n392e30207161 --> n32206c656164
  n392e31207161["9.1 qa_conversation_test_runner"]
  n392e312e3120["9.1.1 qa_run_single_conversation"]
  n392e31207161 -->|2| n392e312e3120
  n696e73746167["instagram_inbound_adapter"]
  n696e73746167 --> n32206c656164
  n696e73746167 --> n322e31206368
  n776562636861["webchat_inbound_adapter"]
  n776562636861 --> n32206c656164
  n776562636861 --> n322e31206368
  n776861747361["whatsapp_webhook_meta"]
  n776861747361["whatsapp_inbound_router"]
  n776861747361 -->|3| n776861747361
```

## Resumen

- Workflows totales: **73**
- Llamadas `executeWorkflow`: **68** (60 pares distintos)
- Con destino dinamico (expresion, no resoluble estaticamente): **0**
- Workflows aislados (ni llaman ni son llamados): **23**

### Destinos que no resuelven a ningun export

El `workflowId` apunta a un id que no existe entre los exports locales. O el workflow vive solo en n8n y nunca se exporto, o quedo una referencia colgada a uno borrado.

- `whatsapp_webhook_meta` :: `WF whatsapp_inbound_router` → `whatsapp_inbound_router` (id `whatsapp_inbound_router`)
- `whatsapp_webhook_meta` :: `WF whatsapp_inbound_router` → `whatsapp_inbound_router` (id `whatsapp_inbound_router`)
- `whatsapp_webhook_meta` :: `WF whatsapp_inbound_router` → `whatsapp_inbound_router` (id `whatsapp_inbound_router`)

### Workflows aislados

No aparecen en el grafo porque ningun `executeWorkflow` los referencia y ellos no llaman a nadie. Puede ser legitimo (se disparan por webhook, cron o trigger de n8n) o puede ser que hayan quedado huerfanos — vale la pena revisarlos.

- 6.30 reconcile_pending_payments
- 8.1 reactivate_bot_after_handoff
- ChatBot AhumadaDetialing
- My Sub-Workflow 1
- My Sub-workflow
- My workflow
- Payment Error Alerts
- QA Notify via Telegram
- QA Summary Every 5 Min
- Verificacion del webhook (Meta)
- WA Reminders
- check_calendar_token
- disconnect_google_calendar
- get_fresh_google_calendar_token
- google_calendar_oauth_callback
- health_check_agents
- onboarding_add_channel
- onboarding_create_agent
- onboarding_manage_service
- webchat_outbound_adapter
- whatsapp_register_number
- whatsapp_register_number
- whatsapp_register_number
