# QA Multiagent Phase 9 — Problemas restantes

Fuente: `QA/results/qa_multiagent_380_389_fresh_2026-06-09.json`

## Resumen

- Steps evaluados: `12`
- Steps pasados: `9`
- Steps fallidos: `3`
- Scenarios con `agent_id`: `8`
- Scenarios con `organization_id`: `8`
- Scenarios con `audit_ok`: `10`
- Scenarios con `tool_name`: `6`

## 1) Legacy sin agente sigue roto (`569900380`)

Estado actual:

- **Corregido por política B**: en multiagente, un evento sin `phone_number_id` no se procesa.
- `569900380` ahora valida descarte explícito con `should_process=false`.
- Resultado validado en `QA/results/qa_multiagent_569900380_after_legacy_policy.json`.
- Auditoría creada con `decision.action=not_processed` y `reason=missing_phone_number_id`.

Casos:

- `569900380` step 1
- `569900380` step 2

Errores:

- `bot is null or empty`
- `empty audit: missing flow_name, decision, idempotency_key or current-step correlation`
- `no response, no action, no state change`
- step 2: esperaba `send_service_menu` o `answer_question`, recibio `null`

Impacto original:

- El modo legacy sin `phone_number_id` no atraviesa el pipeline completo.
- No hay respuesta, estado ni auditoria.

Decision tomada:

- Opcion B: declarar legacy sin `phone_number_id` como no soportado.
- El QA fue ajustado para validar descarte, no procesamiento.

Recomendacion vigente:

- Para multiempresa, usar Opcion B en produccion: todo evento real debe venir con `phone_number_id`.
- Mantener Opcion A solo si aun hay canales internos/QA antiguos que no envian `phone_number_id`.

Fix aplicado:

- `9.0 qa_whatsapp_normalized_router`: `phone_number_id IS NULL` ahora produce `should_process=false`.
- `9.0 qa_whatsapp_normalized_router`: `error_code=missing_phone_number_id`.
- `QA/sql/qa_multiagent_380_389.sql`: `569900380` ahora espera `should_process=false`.

## 2) Agente polarizado responde servicios de Ahumada (`569900385`)

Estado actual:

- **Corregido**: `send_service_menu` ahora responde desde `agent_business_config.config.services`.
- Resultado validado en `QA/results/qa_multiagent_569900385_after_business_merge_fix.json`.
- Respuesta actual contiene `Polarizado` y `lamina`, sin servicios de lavado legacy.
- `audit_ok=true`, `agent_id`/`organization_id` presentes y `tool_name=message.send`.

Caso:

- `569900385`: pregunta `Que servicios tienen?` para `qa-phone-agent-polarizado`.

Resultado original:

- Resuelve `agent_id` y `organization_id`.
- Tiene `audit_ok=true`.
- Tiene `tool_name=message.send`.
- Pero responde menu de Ahumada Detailing:
  - `Lavado basico`
  - `Lavado premium`
  - `Encerado full`

Errores QA:

- `response missing any-of text: polarizado, lamina`
- `response contains forbidden text: Lavado premium, lavado premium`

Impacto:

- Aun hay configuracion hardcodeada de servicios o prompt/knowledge legacy.
- Falla el aislamiento semantico por agente.

Zona probable:

- `3 rules_engine`: regla `send_service_menu` aun usa catalogo hardcodeado.
- `4 context_builder`: puede estar construyendo `business.services` pero `rules_engine` no lo consume para el menu.
- `5 llm_decision`: si el menu sale por LLM, el prompt todavia puede contener Ahumada legacy.
- Subworkflow `6.17 send_service_menu`: puede tener copy hardcodeado.

Recomendacion:

- Mantener el menu de servicios desde `agent_business_config.config.services`.
- No volver a introducir servicios legacy en `rules_engine`, `context_builder` ni `send_service_menu`.

Fix aplicado:

- `3 rules_engine`: preserva `agent_business_config` en la ruta rule-based hacia `action_executor`.
- `3 rules_engine`: mezcla `context_packet.business` con `agent_business_config.config` sin perder `services`.
- `6 action_executor` / `send_service_menu`: ya genera el menu desde `context_packet.business.services`.

## 3) `tool_name` no aparece en acciones sin tool activa (`569900387`, `569900388`)

Estado actual:

- **Corregido**: las acciones que emiten mensaje ahora auditan `tool_name=message.send` aunque no haya tool activa configurada.
- Resultado validado en `QA/results/qa_multiagent_569900387_388_after_toolname_message_fallback.json`.
- `569900387` y `569900388` pasan con `audit_ok=true`, `agent_id`, `organization_id` y `tool_name=message.send`.

Casos:

- `569900387`
- `569900388`

Resultado original:

- Pasan QA.
- Tienen `agent_id`, `organization_id`, `audit_ok`.
- `tool_name` queda vacio.

Contexto:

- Ambos usan agente polarizado.
- El agente polarizado tiene calendario desactivado.
- La decision termina en `ask_missing_data`.

Impacto:

- No rompe esos QA porque no exigian `tool_name`.
- Pero reduce observabilidad: toda respuesta enviada deberia trazarse como `message.send`.

Zona probable:

- `6 action_executor`: aunque ya corrige `message.send` para casos como `569900389`, hay rutas donde no llega `tool_registry` o `mapped_tool_names`.
- `context_builder`: puede no estar enviando `agent_tools` activos en esos casos.

Recomendacion:

- Mantener `tool_name=message.send` para toda accion que emite mensaje, incluso cuando el agente no tiene herramientas de calendario/pricing.
- Agregar expectativa `tool_name_any:["message.send"]` a esos QA si se quiere bloquear regresiones de observabilidad.

Fix aplicado:

- `6 action_executor`: `build_audit_payload` usa fallback `mapped_tool_names[0]`.
- `6 action_executor`: si la accion emite respuesta o pertenece a acciones conversacionales, audita `message.send`.
- `6 action_executor`: `tool_registry.mapped_tool_names` queda poblado con `[message.send]` cuando aplica.

## 4) Mojibake/acentos siguen degradados en respuestas

Casos observados:

- `Lavado bsico`
- `vehculo`
- `opcin`
- `terminacin`
- `proteccin`
- `qu`

Impacto:

- UX baja.
- No afecta pass/fail actual, pero es visible para usuario final.

Zona probable:

- Textos hardcodeados en subworkflows.
- Sanitizador de salida que elimina o corrompe acentos.
- Datos en `agent_business_config` cargados sin UTF-8 correcto.

Recomendacion:

- Mantener strings de runtime sin acentos solo si se decide evitar encoding; si no, corregir end-to-end con UTF-8.
- Agregar QA de mojibake: fallar si respuesta contiene patrones `�`, `├`, `┬`, o perdida sistematica de vocales acentuadas en textos controlados.

## 5) Estado general actual

Ya corregido:

- Resolucion de agente para `384`-`389`.
- Auditoria positiva para agent-aware.
- Auditoria de descarte para negativos `382` y `383`.
- `tool_name=message.send` para rutas conversacionales, incluyendo `381`, `384`, `385`, `387`, `388`, `389`.

Pendiente real:

1. Decidir/fijar comportamiento legacy `569900380`.
2. Corregir UX encoding.
