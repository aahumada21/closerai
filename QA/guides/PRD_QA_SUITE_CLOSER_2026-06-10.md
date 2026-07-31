# PRD - Suite QA Closer Comercial

Fecha: 2026-06-10

## Objetivo

Definir el producto QA necesario para validar el closer antes de uso comercial controlado y luego produccion.

Este PRD convierte la lista actual de casos QA en un backlog implementable, priorizado y medible.

## Problema

Hoy existen QA funcionales y multiagente, pero no hay una especificacion unica para construir una suite comercial completa que cubra:

- captura de lead
- cotizacion
- agenda
- seguimiento
- handoff
- persistencia
- idempotencia
- observabilidad

Sin este PRD, los QA se crean de forma reactiva, con cobertura parcial y sin criterio unico de salida.

## Meta del producto

Construir una suite QA que permita responder con evidencia:

1. El closer vende bien.
2. El closer agenda bien.
3. El closer no inventa datos criticos.
4. El closer mantiene estado y auditoria.
5. El closer falla de forma segura.

## Alcance

Incluye:

- escenarios automatizados en `qa_test_scenarios_temp`
- ejecucion via `9.1 qa_conversation_test_runner`
- lectura estructurada desde `qa_test_results`
- cobertura funcional, comercial y operativa
- evidencia de `decision_action`, `tool_name`, `audit_ok`, `agent_id`, `organization_id` cuando aplique

No incluye en esta version:

- pruebas de carga
- chaos testing de infraestructura
- benchmarking de latencia por nodo
- validacion humana de tono de marca fina

## Usuarios del PRD

- producto
- operaciones
- QA
- desarrollo workflows n8n

## Definicion de exito

La suite QA debe permitir un gate comercial con tres niveles:

### Nivel 1 - Core estable

- lead creation
- identificacion de servicio
- cotizacion
- agenda
- cancelacion
- handoff
- auditoria completa

### Nivel 2 - Comercial confiable

- objeciones
- followups
- reactivacion
- post-servicio
- preguntas frecuentes

### Nivel 3 - Produccion robusta

- idempotencia
- persistencia de estado
- no inventar precio
- no inventar horarios
- recovery tras error
- soporte multimedia y mensajes fragmentados

## Principios de diseno QA

1. Cada QA debe demostrar una capacidad de negocio o un control operativo.
2. Cada QA debe tener expectativa verificable por step.
3. Casos criticos deben validar no solo `passed=true`, sino semantica de negocio.
4. Los escenarios con side effects deben validar auditoria e idempotencia.
5. El QA debe usar lenguaje realista de usuario, no solo frases ideales.

## Contrato minimo por escenario

Cada escenario QA debe definir:

- `scenario_key`
- `name`
- `suite`
- `priority`
- `tags`
- `steps`

Cada `step` debe poder validar:

```json
{
  "role": "user",
  "text": "Hola",
  "expect": {
    "must_have_audit": true,
    "allowed_last_bot_action": ["ask_missing_data"],
    "response_contains_any": ["servicio", "interesa"],
    "response_not_contains": ["error", "null"],
    "tool_name_any": ["message.send"],
    "should_process": true
  }
}
```

## Evidencia requerida por resultado

Cada resultado debe poder leerse con al menos:

```json
{
  "passed": true,
  "scenario_id": "5699...",
  "step_index": 1,
  "decision_action": "ask_missing_data",
  "tool_name": "message.send",
  "audit_ok": true,
  "bot_response": "...",
  "lead_id": "...",
  "agent_id": "...",
  "organization_id": "..."
}
```

## Criterio de aprobacion por prioridad

### Critico

- `passed=true`
- `audit_ok=true`
- sin `bot_response` vacio cuando el caso debe responder
- sin violaciones de precio, horario o side effect

### Alta

- `passed=true`
- semantica correcta
- sin loops
- sin degradacion obvia de UX

### Media

- `passed=true`
- puede tener mejoras de copy o enrichment sin bloquear release

## Backlog maestro QA

| Nº | Accion | Que debe demostrar el QA | Prioridad | Completado | Estado |
|---:|---|---|---|---|---|
| 1 | `new_lead_creation` | Usuario nuevo escribe y se crea lead correctamente | Critico | FALSE | Pendiente |
| 2 | `identify_returning_lead` | Reconoce clientes antiguos y carga contexto | Critico | FALSE | Pendiente |
| 3 | `collect_name` | Obtiene nombre sin pedirlo repetidamente | Alta | FALSE | Pendiente |
| 4 | `collect_vehicle_type` | Detecta auto, SUV, camioneta, etc. | Critico | FALSE | Pendiente |
| 5 | `collect_district` | Obtiene comuna y valida zona de servicio | Critico | FALSE | Pendiente |
| 6 | `collect_service_interest` | Detecta lavado, pulido, ceramic, interior, etc. | Critico | FALSE | Pendiente |
| 7 | `ask_missing_data` | Pide solo el dato faltante necesario | Critico | FALSE | Pendiente |
| 8 | `send_quote` | Entrega precio correcto segun reglas | Critico | FALSE | Pendiente |
| 9 | `quote_explanation` | Explica que incluye el servicio | Alta | FALSE | Pendiente |
| 10 | `recommend_service` | Recomienda servicio segun necesidad del cliente | Alta | FALSE | Pendiente |
| 11 | `upsell_service` | Sugiere mejoras sin ser invasivo | Media | FALSE | Pendiente |
| 12 | `answer_general_question` | Responde dudas frecuentes | Alta | FALSE | Pendiente |
| 13 | `answer_price_objection` | Maneja "muy caro" | Critico | FALSE | Pendiente |
| 14 | `answer_delay_objection` | Maneja "lo veo despues" | Alta | FALSE | Pendiente |
| 15 | `competitor_comparison` | Maneja "otro cobra mas barato" | Alta | FALSE | Pendiente |
| 16 | `offer_booking` | Intenta llevar la conversacion a agenda | Critico | FALSE | Pendiente |
| 17 | `check_availability` | Consulta horarios disponibles reales | Critico | FALSE | Pendiente |
| 18 | `suggest_slots` | Propone horarios al cliente | Critico | FALSE | Pendiente |
| 19 | `confirm_booking` | Crea reserva correctamente | Critico | FALSE | Pendiente |
| 20 | `send_booking_confirmation` | Envia resumen completo de cita | Critico | FALSE | Pendiente |
| 21 | `modify_booking` | Cambia fecha/hora existente | Critico | FALSE | Pendiente |
| 22 | `cancel_booking` | Cancela y libera horario | Critico | FALSE | Pendiente |
| 23 | `prevent_double_booking` | Evita dos reservas mismo horario | Critico | FALSE | Pendiente |
| 24 | `appointment_reminder` | Envia recordatorio automatico | Alta | FALSE | Pendiente |
| 25 | `no_response_followup` | Recupera clientes que desaparecen | Critico | FALSE | Pendiente |
| 26 | `quote_followup` | Hace seguimiento despues de cotizar | Critico | FALSE | Pendiente |
| 27 | `post_service_message` | Contacta despues del trabajo | Alta | FALSE | Pendiente |
| 28 | `request_review` | Solicita resena/testimonio | Alta | FALSE | Pendiente |
| 29 | `reactivate_old_customer` | Recupera clientes antiguos | Media | FALSE | Pendiente |
| 30 | `detect_angry_customer` | Detecta reclamos | Critico | FALSE | Pendiente |
| 31 | `human_handoff` | Deriva correctamente a humano | Critico | FALSE | Pendiente |
| 32 | `stop_after_handoff` | Deja de responder cuando tomo humano | Critico | FALSE | Pendiente |
| 33 | `resume_after_handoff` | Puede volver a automatizacion | Alta | FALSE | Pendiente |
| 34 | `out_of_scope_question` | Maneja preguntas fuera del negocio | Alta | FALSE | Pendiente |
| 35 | `spam_detection` | Ignora basura o mensajes irrelevantes | Media | FALSE | Pendiente |
| 36 | `audio_message_handling` | Procesa audios de WhatsApp | Media | FALSE | Pendiente |
| 37 | `image_message_handling` | Maneja imagenes enviadas por cliente | Media | FALSE | Pendiente |
| 38 | `multiple_messages_merge` | Une mensajes enviados separados | Alta | FALSE | Pendiente |
| 39 | `conversation_summary` | Resume correctamente la conversacion | Alta | FALSE | Pendiente |
| 40 | `state_persistence` | Mantiene estado aunque pasen dias | Critico | FALSE | Pendiente |
| 41 | `business_hours_rule` | Respeta horarios configurados | Alta | FALSE | Pendiente |
| 42 | `service_area_rule` | Maneja comunas fuera de cobertura | Critico | FALSE | Pendiente |
| 43 | `price_rule_validation` | Nunca inventa precios | Critico | FALSE | Pendiente |
| 44 | `availability_rule_validation` | Nunca inventa horarios | Critico | FALSE | Pendiente |
| 45 | `low_confidence_detection` | Detecta cuando no esta seguro | Critico | FALSE | Pendiente |
| 46 | `duplicate_message_protection` | Evita responder dos veces | Critico | FALSE | Pendiente |
| 47 | `idempotency_booking` | Evita crear dos citas iguales | Critico | FALSE | Pendiente |
| 48 | `conversation_recovery` | Continua bien despues de errores | Alta | FALSE | Pendiente |
| 49 | `analytics_tracking` | Guarda eventos comerciales | Alta | FALSE | Pendiente |
| 50 | `audit_log_complete` | Permite revisar todo lo ocurrido | Critico | FALSE | Pendiente |

## Agrupacion por fase de implementacion

## Fase A - Captura y calificacion

Casos:

- `1` a `7`

Objetivo:

- demostrar que el lead entra bien
- demostrar que el estado inicial se completa sin loops
- demostrar que el bot pide solo lo faltante

Definition of Done:

- todos los casos criticos pasan
- no hay loops de pregunta repetida
- `audit_ok=true` en todos los steps

## Fase B - Cotizacion y comercial

Casos:

- `8` a `15`

Objetivo:

- demostrar pricing correcto
- demostrar manejo de objeciones
- demostrar respuestas FAQ y recomendacion

Definition of Done:

- no se inventan precios
- se explica valor correctamente
- objeciones no rompen el flujo

## Fase C - Agenda

Casos:

- `16` a `24`

Objetivo:

- demostrar disponibilidad real
- demostrar creacion, cambio y cancelacion
- demostrar anti-duplicacion

Definition of Done:

- no se inventan horarios
- no hay doble booking
- al cancelar se libera el slot

## Fase D - Followup y post-servicio

Casos:

- `25` a `29`

Objetivo:

- demostrar recuperacion comercial
- demostrar seguimiento de cotizacion
- demostrar post-servicio

Definition of Done:

- followups ocurren en momento correcto
- post-servicio no se dispara de forma incorrecta

## Fase E - Riesgo, handoff y resiliencia conversacional

Casos:

- `30` a `39`

Objetivo:

- demostrar deteccion de clientes complejos
- demostrar handoff limpio
- demostrar soporte de mensajes no ideales

Definition of Done:

- handoff bloquea automatizacion cuando corresponde
- merge de mensajes funciona
- preguntas fuera de scope no desordenan estado

## Fase F - Confiabilidad y control

Casos:

- `40` a `50`

Objetivo:

- demostrar persistencia
- demostrar reglas duras
- demostrar idempotencia y auditoria

Definition of Done:

- no hay side effects duplicados
- auditoria es completa y correlacionable
- recovery tras error mantiene contexto

## Orden recomendado de construccion

1. Implementar primero todos los casos `Critico` de fases A, B, C y F.
2. Luego implementar casos `Alta` de esas mismas fases.
3. Despues cubrir fase D y E completa.
4. Finalmente agregar casos `Media`.

## Gate comercial recomendado

### Gate 1 - Demo interna

Requiere:

- `1`, `4`, `5`, `6`, `7`, `8`, `16`, `17`, `18`, `19`, `22`, `31`, `32`, `43`, `44`, `46`, `47`, `50`

### Gate 2 - Piloto controlado

Requiere:

- todos los `Critico`
- al menos 70 por ciento de `Alta`

### Gate 3 - Produccion comercial

Requiere:

- todos los `Critico`
- todos los `Alta`
- sin issues P0/P1 abiertos en auditoria, agenda, pricing o handoff

## Riesgos que este PRD debe cubrir

- loop de preguntas repetidas
- agenda sin precio valido
- agenda con slot ya ocupado
- cancelacion sin liberar horario
- handoff que no bloquea respuestas
- inventar precio o disponibilidad
- perdida de estado entre mensajes
- auditoria incompleta
- mensajes duplicados

## Recomendaciones para el backlog siguiente

Estas no son parte obligatoria de esta lista base, pero conviene agregarlas despues como extension:

- multiagent routing por `phone_number_id`
- aislamiento semantico entre agentes
- bloqueo de numero no configurado
- bloqueo de agente inactivo
- `tool_name=message.send` obligatorio en respuestas
- guardrail de mojibake
- race condition entre oferta y confirmacion de slot
- fallas outbound de WhatsApp

## Entregables esperados

1. PRD aprobado.
2. Backlog QA marcado por prioridad.
3. SQL por lote de escenarios.
4. Corridas QA por fase.
5. Reporte de resultados por fase.
6. Documento de issues abiertos y fixes aplicados.

## Conclusion

La lista actual ya es una buena base para una suite comercial. El valor de este PRD es ordenar la implementacion, definir gates reales y evitar que el QA se limite a `passed=true` sin validar semantica de negocio.
