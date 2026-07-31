# Arbol de decision del bot

Catalogo de **variables de decision** y **puntos de ramificacion** (condicion -> resultados
posibles) de todo el pipeline del bot Ahumada Detailing, extraido leyendo directamente el
codigo fuente real de cada nodo (no de memoria ni de docs previos). Repartido en 4 archivos
para que cada uno quede manejable:

| Archivo | Cubre |
|---|---|
| `bot_decision_tree.yaml` | `3 rules_engine` (54 reglas, orden real de evaluacion) + catalogo de las 20 acciones de `6 action_executor` (`action_router`) |
| `pipeline_flows.yaml` | `1 whatsapp_inbound_adapter`, `1.1 n8n_chat_test_router`, `2 lead_loader`, `2.1 channel_config_resolver`, `4 context_builder`, `5 llm_decision` |
| `action_subflows.yaml` | Los 28 sub-workflows `6.0`–`6.27` que `action_router` invoca |
| `post_service_and_qa_flows.yaml` | `7 followup_scheduler`, `8.0 human_handof`, `8.1 reactivate_bot_after_handoff`, `9.0/9.1/9.1.1` (runners de QA) |
| `salon_vertical_deltas.yaml` | Diferencias del motor de salon (`3 rules_engine_salon`) contra este arbol -- NO un arbol paralelo completo, solo lo que cambia (ver iniciativa multi-rubro, `docs/MULTI_VERTICAL_INTEGRATION_PLAN_2026-07-25.md`) |

Fuera de alcance (por decision explicita: "herramientas dando vueltas"): utilidades de
calendario/OAuth (`check_calendar_token`, `get_valid_calendar_token`,
`get_fresh_google_calendar_token`, `disconnect_google_calendar`,
`google_calendar_oauth_callback`), `health_check_agents`, `onboarding_create_agent`,
notificaciones (`QA Notify via Telegram` -- renombrado de "QA Notify via WhatsApp" el
2026-07-23, `QA Summary Every 5 Min`), adaptadores de canal
(`webchat_inbound/outbound_adapter`, `whatsapp_register_number`, `whatsapp_webhook_meta`,
`instagram_inbound_adapter`), y workflows inactivos/basura del inventario.

Cada workflow ademas tiene un campo `purpose` (1-3 lineas) con que hace / para que sirve,
agregado el 2026-07-18 sobre la base ya extraida en la primera pasada (solo posibilidades).
En `bot_decision_tree.yaml` tambien hay `purpose` a nivel de las 20 acciones del catalogo.

## Para que sirve

1. **Referencia al arreglar bugs**: antes de releer el JSON crudo de un workflow para
   entender por que el bot respondio X ante un mensaje, buscar aca la regla/nodo que
   gobierna ese caso. En `bot_decision_tree.yaml`, `rule_chain` respeta el orden real
   de evaluacion (primer match gana), asi que tambien sirve para detectar reglas que
   se pisan entre si.
2. **Base para QA combinatorio** (fase futura, no implementada todavia): con esta
   matriz de variables + acciones + sub-flujos se puede generar un lote de escenarios
   QA que cubra combinaciones sistematicamente, en vez del enfoque actual reactivo de
   `QA/GUide/PRD_QA_SUITE_CLOSER_2026-06-10.md`. El generador propuesto emitiria JSON
   en el mismo formato que ya consume `scripts/qa_generate_scenarios.ps1`
   (`scenario_key/name/suite/priority/tags/steps`, usando `expected_outcome` en texto
   libre para que lo evalue el LLM judge que ya existe) — no reemplaza el corpus de
   QA actual, lo alimenta.

### Convenciones para la nueva tanda organizada de QA (2026-07-18)

- **Tabla `qa_test_scenarios_temp` limpiada**: las 5896 filas viejas (16-may a 14-jul)
  se respaldaron en `QA/results/qa_test_scenarios_temp_full_backup_2026-07-18.json` y se
  borraron de la tabla. Arranca vacia para esta nueva tanda organizada.
- **Columna nueva `category`** (`text`, nullable, sin CHECK constraint): para clasificar
  cada escenario por tipo (ej. `base`, `inconsistencia`, `errores` -- lista abierta, se
  puede usar cualquier valor sin tocar el esquema). `scripts/qa_generate_scenarios.ps1`
  ya la soporta (toma `category` del JSON de entrada si esta presente, default `NULL`).
- **Prefijo de `scenario_key` para esta tanda: `5693300000`** en adelante (ej.
  `5693300001`, `5693300002`, ...) -- distinto del prefijo viejo `5699xxxxx` para que
  sea facil distinguir/filtrar esta tanda del historial anterior (ya respaldado y
  borrado). Usar este prefijo en cualquier generador o SQL manual que se escriba de aca
  en adelante.
- **Categoria `base` (prefijo `5693300000`+`5699033001`)**: 8/8 escenarios activos en
  100% PASS (2026-07-19/20). 4 bugs reales encontrados y arreglados en produccion
  durante esta tanda: `ctx.agent_business_config` vs `agentBusinessConfig` (payment_mode
  siempre defaulteaba a "both"), direccion guardada con la frase completa en vez de solo
  la direccion, y reagendar a un dia sin disponibilidad reconfirmaba silenciosamente el
  slot viejo (2 causas: `6.10` normalize_reschedule_input + gap de keywords en
  `ruleRescheduleBooking`). Detalle en `QA/GUide/QA_BASE_SCENARIOS_PLAN_2026-07-18.md`.
- **Categoria `inconsistencia` (prefijo `5693400000`)**: 8/8 escenarios en 100% PASS
  (2026-07-21), plan en `QA/GUide/QA_INCONSISTENCIA_SCENARIOS_PLAN_2026-07-21.md`. Sin
  bugs reales de bot encontrados esta vez; 2 fallas iniciales fueron errores de diseno
  del propio test, corregidos (ver seccion "Bug real de infraestructura de QA" abajo
  para el otro hallazgo, que si es real pero de infraestructura de QA, no del bot).
- **Categoria `errores` (prefijo `5693500000`)**: 1 escenario encadenado (3 pasos:
  horario manual sin contexto comercial -> FAQ multi-vehiculo -> adjunto no soportado),
  100% PASS al final (2026-07-21). 1 bug real de bot encontrado y arreglado: ver
  "rule_multi_vehicle_faq inalcanzable" en `known_gaps` de `bot_decision_tree.yaml`.
  Se decidio NO incluir un escenario de "mensaje vacio" (`rule_empty_message` / action
  `ignore`): el harness de QA (`validate_step_result` en `9.1.1`) no tiene forma de
  expresar "se espera CERO respuesta del bot y eso es correcto" sin usar
  `expect.should_process=false`, que en realidad esta pensado para "el mensaje nunca
  llego a procesarse" (duplicado/canal no resuelto) -- un `ignore` legitimo SI genera
  audit_log, asi que ese flag lo marcaria como fallo igual. Se documenta como
  limitacion del harness, no como gap del bot. Tampoco se agregaron regresiones
  dedicadas de los 4 bugs de `base`: ya quedan cubiertas implicitamente cada vez que
  `base` corre (ej. "Dale, quiero agendar" -> offer_available_slots directo ya prueba
  que payment_mode no rompe; el flujo de reagendar+corregir direccion en 5699033001 ya
  prueba las otras 2), agregar mas seria duplicar sin necesidad.
- **`5693500002` (categoria `errores`, agregado 2026-07-21)**: `rule_returning_customer_reactivation`
  (2 pasos: falta servicio -> pide servicio; con los 3 datos -> cotiza directo), 2/2
  PASS, sin bugs. Investigado antes de generarlo: no depende de config de negocio, a
  diferencia de `rule_staff_selection_reply_*` -- ver `known_gaps` de
  `bot_decision_tree.yaml` para la verificacion contra DB real que confirmo que la
  segunda es codigo inalcanzable hoy (0 filas en `agent_staff`, `staff_selection_mode`
  NULL) y por eso no se le genero QA.
- **`5693500003` (categoria `errores`, agregado 2026-07-21)**: `rule_affirmative_after_price_list_ask_service`
  + `rule_service_selected_after_price_list` (3 pasos encadenados: lista de precios con
  vehiculo/comuna ya conocidos -> afirmacion vaga "Si, dale" -> elige servicio). **1 bug
  real encontrado y arreglado**: `isAffirmativeReply()` no toleraba puntuacion -- "Si,
  dale" (con coma, una forma de escribir MUY comun en espanol casual) no matcheaba
  ningun keyword por la coma en medio. Rompia silenciosamente cualquier regla que
  depende de esta funcion compartida. Fix: quitar puntuacion antes de matchear, local a
  la funcion. Validado con test unitario aislado + regresion completa de las 18
  escenarios/65 pasos existentes (0 fallos) antes de dar el fix por bueno. Tambien se
  documento (sin arreglar, bajo impacto) un falso positivo pre-existente y no
  relacionado: "no me interesa" matchea por el substring "me interesa" sin chequear la
  negacion previa. Detalle completo en `known_gaps` de `bot_decision_tree.yaml`.
- **`6.x` subflows investigados 2026-07-21 sin generar QA nuevo**: `6.17
  send_service_menu` y `6.18 recommend_service` ya estaban 100% cubiertos por `base`
  (`5693300002`/`5693300003`) -- generar algo nuevo hubiera sido duplicado. `6.25 ask_payment_preference`
  esta con `payment_mode=prepago_only` en produccion, que auto-selecciona y salta la
  pregunta por completo (la pregunta real de "como prefieres pagar" solo se activa en
  modo `both`, que no es el estado actual) -- no se caambio la config de produccion solo
  para poder testearlo. `6.26`/`6.27` quedaron fuera de alcance porque llaman a la API
  real de Flow.cl en produccion (decision explicita del usuario, no se generaron ordenes
  de pago reales para QA).
- **Investigacion de sandbox Flow.cl (2026-07-21)**: `6.26`'s nodo `build_flow_signature`
  lee la URL de la API de `$env.FLOW_API_URL` (default `https://www.flow.cl/api` si no
  esta seteada) -- el codigo SI soporta apuntar a sandbox via variable de entorno de
  n8n, sin tocar el workflow. Pero el `apiKey`/`secretKey` de firma (`$env.FLOW_API_KEY`,
  `$env.FLOW_SECRET_KEY`) tienen forma de credenciales de PRODUCCION (verificado en
  `.env` local) -- Flow.cl exige credenciales separadas por ambiente, asi que cambiar
  solo la URL no alcanza. Para habilitar QA real de `6.25`/`6.26`/`6.27` hace falta: (1)
  crear una cuenta sandbox en Flow.cl (tramite externo, lo tiene que hacer quien
  administra la cuenta del negocio, no algo que se pueda hacer desde el codigo), y (2)
  setear las 3 variables de entorno en el servidor n8n de produccion via SSH y
  reiniciar el servicio (cambio de infraestructura en vivo, no un JSON de workflow).
  **Decision del usuario (2026-07-21): queda pendiente de su lado** -- cuando consiga
  las credenciales sandbox, retomar y generar el QA completo del flujo de pago.

### Bug real de infraestructura de QA detectado 2026-07-21 — [RESUELTO 2026-07-21]

`scripts/qa_run_webhook.ps1 -BatchMode` dispara `9.1 qa_conversation_test_runner`, que
usa un nodo `loop_scenarios` (SplitInBatches) para iterar sobre todos los escenarios
`enabled` que matchean el prefijo. **Este loop se cortaba despues de procesar solo el
PRIMER escenario**, sin error visible (la ejecucion en n8n quedaba `status=success`).
Causa raiz confirmada via API de n8n (`GET /executions/{id}?includeData=true`,
inspeccionando `resultData.runData`): dentro del sub-workflow `9.1.1
qa_run_single_conversation`, el nodo `IF has_expected_outcome` tenia su rama FALSE
(cuando el escenario no trae `expected_outcome`, es decir, evaluacion 100%
deterministica via `expect`) **sin ninguna conexion de salida** -- el sub-workflow
terminaba sin emitir ningun item de vuelta al caller. Como el Execute Workflow node
recibia 0 items, n8n no volvia a disparar `loop_scenarios` para el siguiente batch, y la
ejecucion completa terminaba ahi (silenciosamente exitosa, solo 1 de N escenarios
procesado).

**Workaround usado mientras estuvo sin arreglar**: en vez de `-BatchMode`, invocar
`qa_run_webhook.ps1 -ScenarioKey '<key>'` una vez por escenario, en secuencia (con un
poll a `qa_test_results` entre cada uno antes de disparar el siguiente).

**Fix aplicado**: se agrego un nodo `NoOp` nuevo (`finalize_scenario_result`,
id `qa-finalize-scenario-result`) en `9.1.1 qa_run_single_conversation`, y se conecto
tanto la rama FALSE de `IF has_expected_outcome` como la salida de `DB apply_llm_verdict`
(fin de la rama TRUE) hacia ese mismo nodo -- asi el sub-workflow siempre devuelve al
menos 1 item al caller, haya corrido o no el LLM judge. No se toco la logica interna de
ninguna otra parte del sub-workflow. Pusheado a n8n el 2026-07-21.

**Validado**: corrida real de `-BatchMode -TempPrefix "5693"` (matcheo, sin querer, las
16 escenarios enabled de las 3 categorias -- 60 pasos en total) proceso 6+ escenarios
consecutivos sin cortarse, contra el corte-tras-1-escenario de antes del fix.

### Notificaciones migradas de WhatsApp a Telegram (2026-07-23)

Motivo: las notificaciones de WhatsApp llegaban a un grupo ("Grupo AAhumada") y en un
momento se detecto spam de resumenes QA repetidos -- investigado a fondo (ver seccion de
mas abajo sobre el proceso misterioso), sin encontrar la causa raiz exacta pero
confirmando que el query/gate de `QA Summary Every 5 Min` funcionaba bien. El usuario
decidio migrar a Telegram independientemente de esa investigacion.

- **Bot**: `@Vendea_MainReport_bot`, creado por el usuario via BotFather. Token guardado
  como credencial n8n `Telegram QA Bot` (id `j5gHkoJm9QgK0nZO`, tipo `telegramApi`) y
  tambien embebido directo en la URL de los nodos HTTP Request (ver detalle abajo -- no
  se uso el nodo nativo `n8n-nodes-base.telegram` para evitar arriesgar un mismatch de
  parametros no probado; se prefirio HTTP Request directo a la API de Telegram,
  verificado primero con `curl` antes de cablearlo).
- **Destino**: chat privado del usuario (`chat_id: 1734857807`), no un grupo -- decision
  explicita del usuario al migrar.
- **`QA Summary Every 5 Min`**: nodo `Build WA message` ahora emite `chatId` en vez de
  `phone`; nodo `WB Send Summary` cambiado de `n8n-nodes-base.whatsApp` a
  `n8n-nodes-base.httpRequest` (`POST https://api.telegram.org/bot<TOKEN>/sendMessage`,
  form-urlencoded `chat_id`+`text`).
- **`QA Notify via WhatsApp`** renombrado a **`QA Notify via Telegram`**: mismo cambio de
  nodo de envio; `validate_input` ya no exige `phone` en el body (el chat_id quedo fijo,
  no viene del caller); `respond` ya no ecoa `phone` en la respuesta JSON.
- **Resiliencia agregada**: ambos nodos de envio ahora tienen `retryOnFail=true,
  maxTries=3, waitBetweenTries=3000ms` y `options.timeout=15000ms` -- durante las
  pruebas de esta migracion se observo un `ETIMEDOUT` conectando a una IP v6 de
  Telegram (2 minutos hasta fallar) que resulto ser transitorio (un reintento manual
  inmediato despues funciono en 235ms via Node.js puro corriendo como el mismo usuario
  que corre n8n) -- no se identifico una causa de fondo (IPv4/IPv6 funcionan bien por
  separado desde el VPS), se asumio como corte de red puntual y se blindo con reintento
  en vez de seguir investigando algo que no se pudo reproducir a voluntad.
- **Validado end-to-end** 3 veces (incluyendo una fila sintetica insertada y borrada en
  `qa_test_results` para forzar el gate de `QA Summary Every 5 Min` sin esperar
  actividad real) -- mensajes confirmados recibidos por el usuario en Telegram.

## Relacion con el resto de QA/

- `QA/GUide/PRD_QA_SUITE_CLOSER_2026-06-10.md` — backlog de **escenarios** individuales
  (que probar), agrupados en fases. Estos YAML son un nivel mas abajo: el catalogo de
  **variables/ramas** de donde salen esos escenarios.
- `QA/sql/*.sql` + tabla `qa_test_scenarios_temp` — escenarios ya escritos y
  ejecutables via `scripts/qa_run_webhook.ps1`.
- `QA/GUide/QA_TEMP_SCENARIO_EXAMPLE.md` — referencia del formato exacto de escenario
  (`steps`, `expect`, `expected_outcome`).

## Como mantenerlo al dia

Cuando cambie cualquier workflow cubierto:

1. Releer el jsCode real del nodo (no grepear el `.json` crudo — el campo `jsCode`
   viene como string de una sola linea con `\n` escapados; hay que hacer `JSON.parse`
   del export y extraer `node.parameters.jsCode` a un archivo `.js` normal antes de
   poder grepearlo/leerlo linea por linea). Para nodos `n8n-nodes-base.if` / `switch` /
   Postgres, la condicion esta directamente en `node.parameters` (conditions/rules/query),
   no hace falta extraerla.
2. Para `rules_engine`, confirmar el orden de evaluacion mirando el array literal
   `const rules = [...]` (no el orden en que las funciones estan definidas en el
   archivo — son distintos).
3. Actualizar `meta.last_verified_against_source` en el YAML correspondiente con la fecha.

## Gaps conocidos detectados durante la extraccion — RESUELTOS 2026-07-18

Se encontraron solo por lectura de codigo, y los 4 ya se arreglaron directamente en los
archivos `.json` de `workflows/exports/uncategorized/` y se subieron a n8n con
`scripts/n8n_update_workflow_from_export.ps1`. Estado del push (2026-07-18):
`3 rules_engine` y `8.0 human_handof` ya estan en n8n; `6.26 payment_request` y
`6.27 payment_confirmed_webhook` estan arreglados en el archivo local pero el push a
n8n lo tiene que correr el usuario manualmente (bloqueado por un guardrail de permisos
para pushes en vivo a workflows de pago).

- **`answer_faq` sin ruta** — `rule_multi_vehicle_faq` (en `3 rules_engine`) ahora emite
  `action: "answer_question"` en vez de `"answer_faq"`, consistente con el resto de las
  reglas de FAQ. No se toco `action_router`. Ver `known_gaps` en `bot_decision_tree.yaml`.
- **`6.26 payment_request`, mensaje de error nunca enviado** — `build_payment_error` ahora
  arma el mensaje con el contexto real (channel/phone) y se agrego un nodo dedicado
  (`Call 6.1 send_payment_error_message`) para enviarlo, sin arrastrar la rama de error
  por el bookkeeping de DB que es exclusivo del camino de exito. Ver `known_gaps` en
  `action_subflows.yaml`.
- **`6.27 payment_confirmed_webhook`, sin guard de idempotencia** — se agrego un nodo
  `IF already_paid` que corta a una respuesta terminal si el pago ya estaba confirmado
  (webhook duplicado), mas un `AND payment_status IS DISTINCT FROM 'paid'` en el UPDATE
  como defensa extra. Ver `known_gaps` en `action_subflows.yaml`.
- **`8.0 human_handof`, bug de orden** — el chequeo de stage ahora es un `else if`, asi
  que un reclamo siempre se asigna a `soporte` sin importar el stage del lead. Ver
  `known_gaps` en `post_service_and_qa_flows.yaml`.

**Nota sobre `workflows/exports/manual/`**: existe una carpeta paralela con exports mas
viejos de al menos 3 de estos 4 workflows (`6.26`, `6.27`, `3 rules_engine`, con distinta
convencion de nombre de archivo) que **no se tocaron** — esos ya tenian cambios locales
sin commitear antes de esta sesion, ajenos a este arreglo. Segun `docs/WORKFLOW_TAXONOMY.md`,
`uncategorized/` es la unica carpeta que usa el sync real, asi que en principio `manual/`
es una copia vieja/redundante — pero no se verifico eso a fondo, asi que vale la pena
confirmarlo antes de asumir que `manual/` no importa.

## Limitaciones conocidas de esta version (2026-07-18)

- `action_executor` (`6.x`) esta cubierto a nivel de Switch principal + logica interna
  de cada sub-workflow (branches), pero no todo detalle operacional (ej. shape exacto
  de cada payload a Google Calendar).
- El prompt real que usa `5 llm_decision` en produccion probablemente viene de la tabla
  `agent_prompt_templates` en DB, no del `legacyDecisionPrompt` hardcodeado documentado
  en `pipeline_flows.yaml` — ese texto es solo el fallback cuando la DB no tiene filas
  configuradas. Verificar contenido de esa tabla antes de asumir que ese wording exacto
  gobierna el comportamiento en vivo.
