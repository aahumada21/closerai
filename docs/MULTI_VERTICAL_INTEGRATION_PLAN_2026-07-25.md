# Plan: integración multi-rubro (2do rubro = salón de belleza)

Fecha: 2026-07-25

## 1. Objetivo

Hoy el sistema atiende un solo rubro (detailing / lavado de autos a domicilio). El
objetivo es incorporar un **segundo rubro (salón de belleza)** sin duplicar
infraestructura, y dejar la configuración de "qué rubro es cada agente" lista para que
se resuelva **desde el panel de administración Next.js** (`closer.aahumada.com`, ver
`docs/PANEL_BUILD_GUIDE_2026-06-22.md` y `docs/ONBOARDING_API_2026-06-22.md`) — no a
mano vía SQL como hoy.

Esto **no es una guía de configuración de un número nuevo dentro del mismo rubro**
(para eso ya existe `docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md`, que además dice
explícitamente: *"Una línea de negocio distinta... requiere una copia/variante de los
workflows principales, no solo una fila nueva en estas tablas"*). Este documento es el
plan para esa copia/variante, más el contrato que el panel necesita para configurarla.

## 2. Decisión arquitectónica

**Una sola instancia de n8n (mismo servidor, mismas credenciales, misma
infraestructura de pagos/alertas/QA), pero un motor de reglas separado por rubro.**

No se eligió "un solo motor 100% genérico configurable por JSON" porque:
- `3 rules_engine` (`rules_evaluation`) tiene ~50 funciones con vocabulario de
  detailing escrito directo en el código: `vehicle_type` como campo obligatorio,
  valores `SUV/sedan/hatchback/camioneta/...`, reglas de negocio específicas del rubro
  (ej. "atendemos un vehículo a la vez", la lógica de "otro auto" arreglada esta misma
  sesión). Un salón no tiene "vehículo" — tiene "servicio" (corte, color, manicure...)
  y probablemente "estilista", que es un concepto distinto, no un sinónimo.
- `pricing_versions`/`service_vehicle_prices` modela precios como una grilla
  **servicio × tipo_vehículo**. Un salón necesita, como mínimo, precio por servicio
  (posiblemente × estilista/nivel), no por vehículo — es una dimensión distinta, no
  solo otros valores en la misma columna (ver sección 5, decisión de esquema).
- Refactorizar esas ~50 reglas para que lean el vocabulario del negocio 100% desde
  config es una reescritura grande y riesgosa (esta sesión mostró varias veces cuántos
  bugs sutiles aparecen con cambios chicos en ese archivo).

No se eligió "instancia de n8n separada por rubro" porque duplicaría para siempre todo
lo que **ya es genérico y funciona**: pagos Flow (`6.26`-`6.30`), calendario
(`6.2`/`6.3`), cancelación/reagenda, alertas por Telegram, el QA harness (`9.x`), y el
modelo de datos multi-tenant que ya existe (`organizations`/`agents`/
`agent_business_config`/`agent_channels`). Cada bug de esos sistemas (y esta sesión
encontró varios reales) habría que arreglarlo dos veces y vigilar que no se desincronicen.

### Qué se comparte tal cual (sin cambios, mismo workflow para todos los rubros)

| Workflow | Por qué es genérico |
|---|---|
| `1 Inbound_router` / `1 whatsapp_inbound_adapter` | Rutea por `agent_channels`, no sabe de rubros |
| `2 lead_loader` | Carga lead + config del agente, agnóstico al contenido de esa config |
| `2.1 channel_config_resolver` | Igual |
| `6.1 send_outbound_message` | Solo envía texto |
| `6.2 check_calendar_slot` / `6.3 create_calendar_booking` | Trabajan con `calendar_id`/fecha/hora/duración, no con el tipo de servicio |
| `6.5 confirm_booking_executor` / `6.6 cancel_booking` / `6.10 reschedule_booking` | Mecánica de citas (crear/cancelar/reagendar evento + fila en `appointments`), agnóstica al rubro. Incluye el soporte multi-reserva-por-lead arreglado hoy. |
| `6.24 persist_and_audit` | Persistencia genérica de `lead_state` + auditoría |
| `6.26`–`6.30` (Flow: link de pago, webhook, check status, holds, reconciliación) | 100% genérico, ya parametrizado por `agent_business_config.config.payment_mode` |
| `Payment Error Alerts`, `QA Notify via Telegram` | Infraestructura, no lógica de negocio |
| `9.x` (QA conversation test runner) | El motor de pruebas es agnóstico; lo que cambia son los *escenarios* (texto de los mensajes) |
| `7 followup_scheduler` | Genérico (recordatorios, no depende del rubro) |
| Onboarding API, panel Next.js (Supabase + RLS) | Infraestructura de configuración, agnóstica al rubro salvo por los campos nuevos de la sección 5 |

### Qué se clona/adapta por rubro

| Workflow | Motivo |
|---|---|
| `3 rules_engine` | Vocabulario y reglas de negocio específicas (ver arriba) |
| `4 context_builder` (parcialmente) | `ALLOWED_ACTIONS_BY_STAGE`/`SUPPORTED_ACTIONS` pueden variar si el salón no usa alguna acción de detailing (ej. `collect_address`/`confirm_address` no aplican si el servicio es siempre en el local, no a domicilio) |
| `6.7 ask_missing_data`, `6.8 send_quote`, `6.13 send_pre_service_instruction`, `6.14 notify_on_the_way`, `6.17 send_service_menu`, `6.18 recommend_service` | Contenido/mensajes específicos del rubro. Varios de estos podrían sobrevivir solo con `agent_business_config.config.messages{}` (ya existe ese mecanismo, ver `PER_NUMBER_CONFIG_GUIDE`) en vez de clonarse — evaluar caso a caso en la Fase 1 (ver más abajo). |
| `onboarding_create_agent` (webhook de alta) | Hoy crea, hardcodeado, la config y precios por defecto de **detailing** — necesita un parámetro `vertical` + una plantilla de defaults por rubro (ver sección 5) |
| `resolve_pricing_from_db` (o equivalente) | La dimensión de precio cambia (servicio × vehículo → servicio × ¿estilista/nivel?) |
| Catálogo de QA (`QA/decision_tree/*.yaml`, escenarios en `qa_test_scenarios_temp`) | Nuevo árbol de decisión y escenarios para el vocabulario del salón |

## 3. Diferencia estructural más importante: a domicilio vs. local

Detailing viaja al cliente (`service_address`, `confirm_address`, `notify_on_the_way`
tiene sentido: "vamos en camino"). Un salón de belleza normalmente es al revés: el
cliente va al local. Esto implica, para el rubro salón:

- Probablemente **no** se necesita `collect_address`/`confirm_address` del cliente —
  en su lugar, si hay más de un local, se necesita "¿en qué sucursal?" (un concepto
  nuevo, no cubierto hoy por nada existente — ver sección 5, tabla `agent_locations`).
- `notify_on_the_way` no aplica igual (nadie "va en camino" al cliente); en cambio
  podría convertirse en un recordatorio "tu hora es en 30 min, te esperamos en
  [sucursal]".
- `send_pre_service_instruction` cambia de contenido completo: "deja el auto
  accesible..." no tiene sentido; un salón podría avisar "llega 10 min antes",
  "si vienes por color, ven sin tratamientos previos", etc.

**Esto es una decisión de producto, no solo de código — hay que definir con el
usuario cómo opera el salón (¿un local? ¿varios? ¿a domicilio también?) antes de
clonar `context_builder`/`rules_engine`.** Ver preguntas abiertas, sección 7.

## 4. Mecanismo técnico de ruteo por rubro

Se agrega `agent_business_config.config.vertical` (texto, ej. `"detailing"` /
`"salon"` — **valores exactos y en minúscula, son la clave literal del mapa de
despacho dinámico en `2 lead_loader`; un valor distinto ahí cae silenciosamente
al fallback de detailing sin avisar**), **no** un campo nuevo en `agents`. Motivo: es exactamente el mismo
patrón que ya usa `payment_mode` — versionado junto con el resto de la config, sin
tocar el esquema de `agents`, sin RLS nueva que escribir (la tabla `agent_business_config`
ya tiene RLS lista, ver `PANEL_BUILD_GUIDE` sección 3), y leído desde el mismo lugar
(`context_packet.agent_business_config.config`) donde ya se lee `payment_mode` hoy.

- Un mapa fijo `vertical -> workflow_id de rules_engine` (y, si aplica,
  `context_builder`/`resolve_pricing`) vive como constante en el nodo n8n que hace el
  dispatch — **no** en la base de datos. El *routing* entre motores es una decisión de
  despliegue (qué workflows existen), no de configuración de negocio (eso ya lo cubre
  `vertical` en sí).
- En `2 lead_loader` (o el nodo que hoy invoca "Rules Engine"), el `executeWorkflow`
  que llama a `3 rules_engine` cambia de "ID fijo" a "ID dinámico" (n8n permite
  `workflowId` por expresión) — resuelve el ID según `vertical` antes de llamar.
- Si `vertical` no está seteado (agentes existentes hoy), default a `"detailing"` —
  **cero cambio de comportamiento para el negocio actual**, la migración es aditiva.
- **`vertical` se define una sola vez, al crear el agente, y no debería poder
  cambiarse después** desde el panel (cambiar de rubro a mitad de vida de un agente
  significaría que el motor de reglas cambia debajo de conversaciones en curso). El
  campo debería mostrarse como solo-lectura en el editor de configuración, editable
  únicamente en el formulario de alta.

Esto significa: agregar el 2do rubro **no toca ni un bit del comportamiento actual**
de Ahumada Detailing — solo agrega una rama nueva que nunca se ejecuta para agentes
existentes.

## 5. Contrato para el panel Next.js

Esta sección es la que el equipo/agente que construye el panel necesita para dejar
todo lo de esta sección **configurable desde la UI**, sin volver a tocar SQL a mano
(siguiendo el mismo criterio que `PANEL_BUILD_GUIDE`/`ONBOARDING_API`).

### 5.1 Cambios en `onboarding_create_agent` (el webhook de alta)

Agregar al request body (ver `docs/ONBOARDING_API_2026-06-22.md`):

```json
{
  "vertical": "detailing | salon",
  "...": "resto de los campos ya existentes, sin cambios"
}
```

- **Default si se omite: `"detailing"`** — los paneles/integraciones existentes que
  todavía no manden este campo siguen funcionando exactamente igual que hoy.
- El webhook, según `vertical`, elige qué plantilla de `agent_business_config.config`
  y qué precios por defecto insertar (hoy solo existe la plantilla de detailing,
  hardcodeada). Para salón, la plantilla por defecto trae 3-5 servicios de ejemplo
  (ver preguntas abiertas, sección 7, pregunta 6) para que el negocio tenga algo con
  qué probar antes de cargar su catálogo real.
- El response (`prices_created`, etc.) no cambia de forma, solo de contenido.

### 5.2 Pantalla "Alta de agente nuevo" (ya listada en `PANEL_BUILD_GUIDE` sección 6.2)

- Agregar un selector **Rubro** (`detailing` / `salón de belleza`, más adelante otros)
  antes de los demás campos del formulario. Se manda como `vertical` al webhook.
- Una vez creado el agente, este campo pasa a ser de **solo lectura** en cualquier
  pantalla de edición posterior (ver sección 4).

### 5.3 Pantalla "Editor de configuración del agente" (sección 6.3 de `PANEL_BUILD_GUIDE`)

- Leer `config.vertical` primero y renderizar el formulario condicionalmente:
  - `detailing`: formulario actual, sin cambios (comunas de cobertura, tipos de
    vehículo, etc. — ver `PER_NUMBER_CONFIG_GUIDE`).
  - `salon`: reemplaza "comunas de cobertura" por "sucursales" **si** la
    respuesta a la pregunta abierta 7.1 es "varios locales" (requiere tabla nueva
    `agent_locations`, mismo patrón RLS que `agent_staff`: `agent_id, name, address,
    calendar_id, schedule, is_active, display_order`). Si el salón es de un solo
    local, no hace falta tabla nueva — el `calendar_id`/`schedule` de
    `agent_business_config` alcanza igual que hoy.
  - Los bloques de **horario** (`schedule[]`), **staff** (`agent_staff` +
    `staff_selection_mode`) y **mensajes** (`messages{}`) se reusan tal cual para
    cualquier rubro — mismo componente de formulario, sin lógica condicional nueva.

### 5.4 Pantalla "Editor de precios" (sección 6.4 de `PANEL_BUILD_GUIDE`)

Decisión de esquema recomendada: **relajar `service_vehicle_prices.vehicle_type` a
nullable** en vez de crear una tabla paralela. `vehicle_type = NULL` pasa a significar
"esta fila no tiene una segunda dimensión — precio único por servicio", que es
exactamente el caso de un salón sin variación de precio. Ventaja: una sola tabla, un
solo componente de panel, sin migración de datos para lo que ya existe (todas las
filas actuales de detailing ya traen `vehicle_type` no nulo).

- `detailing`: grilla servicio × tipo de vehículo, sin cambios.
- `salon` (si la respuesta a 7.3 es "precio fijo por servicio"): el panel
  renderiza una lista simple servicio → precio (una fila por servicio, columna
  `vehicle_type` oculta/enviada como `NULL`).
- Si la respuesta a 7.3 termina siendo "varía por estilista/categoría" en vez de por
  vehículo, esa palabra (`vehicle_type` → renombrar conceptualmente a "dimensión
  secundaria" en la UI, sin tocar el nombre de columna en la base) se reutiliza para
  esa segunda dimensión — el panel solo necesita poder mostrar una etiqueta de columna
  configurable en vez de hardcodear "tipo de vehículo".

### 5.5 Resumen de cambios de esquema necesarios

| Cambio | Tipo | Impacto en RLS |
|---|---|---|
| `agent_business_config.config.vertical` (nuevo campo JSON) | Aditivo, sin migración | Ninguno — ya cubierto por la policy existente de la tabla |
| `service_vehicle_prices.vehicle_type` → nullable | Migración de esquema (1 columna) | Ninguno — misma tabla, misma policy |
| `agent_locations` (nueva tabla, **solo si** el salón tiene varios locales) | Tabla nueva | Nueva policy RLS, mismo patrón que `agent_staff` (miembro de la organización puede SELECT/INSERT/UPDATE, sin DELETE) |

Todo lo demás (mensajes, servicios, horarios, staff, canales) usa exactamente las
tablas y el patrón de versionado que ya describe `PER_NUMBER_CONFIG_GUIDE` — no hace
falta ninguna tabla nueva para eso.

## 6. Fases propuestas

### Fase 0 — Preparación (sin impacto visible) — ✅ COMPLETA (2026-07-26)
- ✅ `agent_business_config.config.vertical` agregado (versión 15, activa, para el
  agente Ahumada Detailing) con valor `"detailing"`. Insertado como versión nueva
  (no in-place), siguiendo el patrón de versionado establecido.
- ✅ `service_vehicle_prices.vehicle_type` relajado a nullable (`ALTER COLUMN ...
  DROP NOT NULL`). Verificado: las 63 filas existentes conservan su valor, sin
  impacto en datos.
- ✅ Webhook `onboarding_create_agent` (id `OnHysjH5lvf77zbJ`) acepta parámetro
  `vertical` en el body (default `"detailing"` si se omite — panels/integraciones
  existentes siguen funcionando igual). Se guarda en `agent_business_config.config.vertical`
  del agente creado. La plantilla de servicios/precios por defecto sigue siendo la
  de detailing para cualquier valor de `vertical` — eso es trabajo de la Fase 1
  (todavía no existe una plantilla de salón que elegir).
- ✅ Despacho dinámico construido: el nodo "Rules Engine" en `2 lead_loader` ahora
  resuelve el `workflowId` por expresión (mapa fijo `vertical -> workflow id`, hoy
  solo tiene la entrada `"detailing"`) en vez de un ID fijo. Cuando se cree el motor
  de reglas del salón (Fase 1), agregar su entrada al mapa es el único cambio
  necesario en este nodo.
- ✅ Probado: smoke test QA (`5693600099`) contra el agente de Ahumada Detailing
  real, confirma respuesta idéntica a la de siempre — cero cambio de comportamiento.
- Preguntas abiertas de la sección 7: respondidas 2026-07-26 (un solo local, varias
  estilistas, precio por categoría/nivel de estilista en vez de tipo de vehículo,
  mismos 4 modos de pago Flow, multi-servicio el mismo día permitido, catálogo MVP =
  corte/color/manicure/tratamiento facial/peinado).

### Fase 1 — Clonar y adaptar el motor de reglas (MVP salón) — ✅ MVP COMPLETO (2026-07-26)
- ✅ Clonado `3 rules_engine` → nuevo workflow `3 rules_engine_salon` (id
  `zhwv70Fiz7zdIDn8`, activo). Mismos 18 nodos/conexiones que el original; único
  cambio: el código del nodo `rules_evaluation`.
- ✅ Vocabulario reemplazado en las funciones centrales de extracción (usadas por
  ~50 reglas, un solo punto de cambio cada una): `extractServiceInterestFromText`
  (corte/color/manicure/tratamiento_facial/peinado), `extractVehicleTypeFromText` /
  `normalizeVehicleType` / `isGenericVehicleType` / `hasExplicitVehicleOwnership`
  (ahora detectan categoría de estilista Junior/Senior en vez de tipo de vehículo —
  **la columna `vehicle_type` de `lead_state` se mantiene igual, solo cambia el
  significado de su valor**, según la restricción ya documentada), y
  `mentionsAnotherVehicle` (ahora "otro servicio"/"otra cita" en vez de "otro auto").
- ✅ `district` se autocompleta al entrar al motor (primer valor de
  `agent_business_config.config.coverage.districts`, o `"Local"` si no hay
  ninguno) — evita tener que tocar los ~50 puntos del código que leen
  `ctx.leadState.district`, ya que nunca vuelve a estar vacío para un negocio de un
  solo local.
- ✅ Quitadas del array `rules` (código de las funciones queda pero inalcanzable,
  no se borró para minimizar el diff) 6 reglas específicas de auto sin equivalente
  en salón: `ruleRecommendPremiumWhenVeryDirty`, `ruleMultiVehicleFaq`,
  `ruleVehicleRuralNeedsClarification` (+ su reply-handler),
  `ruleCheaperAlternativeRequest`, `ruleInlineCompleteBookingRequest`.
- ✅ Reescritos ~18 mensajes/funciones con vocabulario de auto hardcodeado
  (`buildBusinessFaqMessage`, `ruleQuoteRequest`, `ruleMissingRequiredFields`,
  `ruleAffirmativeAfterPriceListAskService`, y otras ~14 detectadas en un barrido
  completo con grep) — ver `project_multi_vertical.md` en memoria para el detalle.
- ✅ Registrada la entrada `"salon": "zhwv70Fiz7zdIDn8"` en el mapa de despacho
  dinámico del nodo "Rules Engine" en `2 lead_loader` (Fase 0).
- ✅ Agente de prueba creado directo por SQL (no vía webhook de onboarding, para no
  depender del token compartido que vive solo en el entorno de n8n): `agents`
  (`fb3a6a81-012b-4828-88f9-09c1ed86c593`, slug `salon_bella_test`, misma
  organización que Ahumada Detailing), `agent_business_config` v2 activa (vertical
  `salon`, 5 servicios, horario Lun-Sáb 10-19, `payment_mode: both`,
  `pricing_policy.requires_service_vehicle_district: false`), `pricing_versions` +
  10 filas de `service_vehicle_prices` (5 servicios x Junior/Senior), 2 filas de
  `agent_staff` (Camila=Junior, Valentina=Senior, `staff_selection_mode: auto`), 1
  fila de `agent_rules` (`lead_required_fields` con mensajes/goals de salón).
- ✅ Probado end-to-end vía el harness de QA existente (canal WhatsApp QA con
  `phone_number_id: qa-phone-agent-salon`, mismo mecanismo que ya usaban los
  agentes de prueba `qa_agent_lavado`/`qa_agent_polarizado` — no hizo falta tocar
  el harness). 5 escenarios (`5699060001-5`, suite `multivertical_salon`): 4/5
  PASS (menú de servicios detecta y devuelve las 5 opciones correctas; cotización
  de "corte" pide categoría de estilista en vez de vehículo/comuna; flujo de 2
  pasos servicio+categoría completa la cotización; "manicure con la senior"
  detecta servicio y categoría en el mismo mensaje; FAQ "junior o senior" responde
  con la explicación correcta).
- ⚠️ **Gap conocido, no bloqueante**: el escenario `5699060001` (menú de servicios)
  falla porque la frase de cierre del mensaje sigue mencionando "vehículo"/"auto" a
  pesar de `pricing_policy.requires_service_vehicle_district: false`. Causa raíz
  identificada (no es del código nuevo del salón): el nodo compartido
  `build_context_packet` de `4 context_builder` arma `context_packet.business` con
  `config_source: "legacy_business_rules"` (rama vieja, con `pricing_policy: ""`)
  en vez de `"agent_business_config"` para este agente — aunque
  `agent_business_config.config` sí le llega completo y correcto al action_executor
  por otro lado. Es un bug latente en infraestructura compartida (afectaría a
  cualquier agente que use ese flag, incluyendo detailing si algún día lo usara),
  no algo introducido por el clon de salón. Pendiente investigar/arreglar en una
  pasada aparte — no bloquea el MVP porque el resto de la conversación (cotizar,
  detectar servicio+categoría, FAQ) funciona correctamente.
- Pendiente para una vuelta futura (no MVP): agendar/pagar/cancelar reales con
  Google Calendar (el agente de prueba tiene `calendar_id: ""` a propósito, para no
  arriesgar el calendario real de Ahumada Detailing durante las pruebas).

### Fase 2 — Mensajería y flujo pre/post-servicio — ✅ COMPLETA (2026-07-26)
- ✅ **Bug raíz del gap conocido de Fase 1, encontrado y arreglado**: en el nodo
  compartido `send_service_menu` (inline dentro de `6 action_executor`), el
  objeto `business` se resolvía como
  `data.business || contextPacket.business || rawBusinessConfig`, y
  `contextPacket.business` (un snapshot armado antes por `4 context_builder`)
  podía llegar con `config_source: "legacy_business_rules"` y campos de política
  vacíos, aunque `agent_business_config.config` (`rawBusinessConfig`) sí llegara
  completo y fresco por otro camino. Se invirtió la prioridad
  (`rawBusinessConfig || data.business || contextPacket.business`) — cero
  cambio de comportamiento para detailing (que no usa ese flag), y resuelve el
  gap de salón. Confirmado con el escenario `5699060001` (antes fallaba, ahora
  pasa) y regresión en escenarios reales de detailing (`5693300003`,
  `5699033003`, ambos siguen en PASS).
- ✅ `6.18 recommend_service`: agregada una rama genérica (activada por el mismo
  flag `pricing_policy.requires_service_vehicle_district: false`) que busca el
  servicio mencionado contra `business.services[].aliases` (ya genérico, sin
  vocabulario de auto) y si no encuentra match pide aclarar listando el catálogo
  configurado — reemplaza la heurística de "qué tan sucio está el auto"
  (que sigue intacta para detailing).
- ✅ `6.13 send_pre_service_instruction`: rama genérica ("llega 5-10 min antes,
  trae referencia de imagen si quieres, avisa si necesitas reprogramar") en vez
  de "deja el vehículo accesible/retira objetos/portón/conserje", activada por
  el mismo flag.
- ✅ `6.14 notify_on_the_way`: mensaje de "voy en camino" reemplazado por un
  recordatorio ("tu hora es pronto, te esperamos en el local") para el caso
  genérico — no se encontró ninguna regla en `rules_evaluation` (ni detailing
  ni salón) que dispare esta acción directamente; solo queda accesible vía el
  path de LLM decision, así que este cambio es defensivo más que crítico.
- ✅ `6.15 request_review`: nombre del negocio ahora se resuelve dinámicamente
  (`agent_business_config.config.business_name` → `organization.name` →
  `agent.name` → fallback genérico) en vez de tener "Ahumada Detailing"
  hardcodeado.
- ✅ `6.16 request_referral`: el mensaje por defecto (cuando no hay
  `referral_message` explícito, que es el caso siempre hoy — ese override no
  está cableado desde ningún lado) se generalizó quitando "dejar su auto
  impecable" y "trabajamos a domicilio".
- ✅ Decisión "a domicilio vs. local" (sección 3): ya resuelta en Fase 1 — un
  solo local, el cliente llega al salón, sin `collect_address`/`confirm_address`
  (esos stages simplemente nunca se alcanzan porque `district` se autocompleta y
  el motor de salón no tiene ninguna regla que dispare `collecting_address`).
- ✅ Probado con 2 escenarios QA nuevos (`5699060006` recommend_service,
  `5699060007` review con nombre dinámico) — ambos PASS — más los 5 de Fase 1
  (ahora 5/5, el gap quedó resuelto). 7/7 escenarios de salón en PASS.
- Pendiente (no bloqueante, bajo impacto): cablear un override real de
  `referral_message`/`pre_service_instructions` desde
  `agent_business_config.config.messages{}` hacia estos sub-workflows —
  ninguno de los `Call 6.x` en `action_executor` reenvía hoy
  `agent_business_config` en su mapeo de inputs (solo `context_packet`, que
  puede llegar con el bug de arriba en casos raros). Por ahora la rama
  genérica basada en `pricing_policy.requires_service_vehicle_district` cubre
  el caso real sin necesitar ese cableado adicional.

### Fase 3 — QA dedicado — ✅ COMPLETA (2026-07-26)
- ✅ **Deltas documentadas en vez de un árbol paralelo completo**:
  `QA/decision_tree/salon_vertical_deltas.yaml` — el motor de salón es un clon con
  ~95% de código idéntico al de detailing, así que un árbol completo duplicado se
  habría desincronizado en la primera actualización de cualquiera de los dos. El
  archivo nuevo documenta solo lo que cambia (vocabulario, reglas quitadas/agregadas,
  bugs de infraestructura compartida encontrados) y remite a
  `bot_decision_tree.yaml`/`action_subflows.yaml` para todo lo demás (vigente para
  ambos rubros).
- ✅ **Probado end-to-end de punta a punta, con dos técnicas**: escenarios en
  `qa_test_scenarios_temp` (suite `multivertical_salon`, `5699060001-13`) para casos
  de un solo turno o pocos turnos; y control manual turno-a-turno posteando
  directamente al webhook `qa-whatsapp-normalized` para flujos largos (5-8 mensajes)
  — se descubrió que el harness multi-paso (`9.1.1`, `loop_steps`) corta después del
  primer paso en escenarios largos (bug de infraestructura de QA preexistente, no
  introducido esta sesión — mismo síntoma que el bug de `loop_scenarios` ya
  documentado y resuelto el 2026-07-21, pero a nivel de pasos dentro de un
  escenario, no de escenarios dentro de una corrida — pendiente de investigar en
  otra pasada, no bloqueante porque el control manual da el mismo resultado con más
  trabajo).
- ✅ **Los 4 modos de pago probados de punta a punta y funcionando** (incluyendo
  links reales de Flow.cl sandbox — el VPS sigue en modo sandbox desde el
  2026-07-24, ver memoria):
  - `both`: pregunta preferencia de pago antes de ofrecer horarios.
  - `prepago_only`: autoselecciona prepago sin preguntar, genera link real.
  - `postpago_only`: nunca genera link, reserva confirmada directo.
  - `prepago_required`: crea hold de 30 min + link de pago, no reserva hasta pagar.
- ✅ **Cancelar y reagendar reserva existente**: ambos funcionan correctamente con
  mensajes genéricos (sin vocabulario de auto).
- ✅ **Multi-servicio el mismo día**: encontrado y arreglado un bug real (ver
  `salon_vertical_deltas.yaml` para el detalle completo) — pedir un segundo
  servicio distinto mientras ya se tiene una reserva confirmada no tenía ninguna
  regla determinística que lo manejara, caía al LLM, y terminaba creando una
  segunda reserva del servicio EQUIVOCADO (el mismo original en vez del nuevo
  pedido). Se agregó una regla nueva (`ruleAdditionalServiceRequestWhileBooked`,
  solo en el motor de salón) que detecta el pedido y arranca un flujo de
  cotización limpio para el servicio nuevo sin tocar la reserva existente.
  Validado: 2 reservas separadas y correctas coexistiendo para el mismo lead.
- ✅ **6 bugs reales más encontrados y arreglados en infraestructura compartida**
  (`6.5`, `6.10`, `6.13`, `6.14`, `6.15`, `6.16` — detalle completo en
  `salon_vertical_deltas.yaml`), todos con regresión verificada en detailing (cero
  cambio de comportamiento, ya sea por construcción lógica del fix o por corrida
  real de escenarios existentes).

### Fase 4 — Panel + alta del negocio real — 🔶 EN CURSO (n8n listo, panel pendiente)
- ✅ **Lado n8n completo y probado (2026-07-26)**: `onboarding_create_agent` ahora
  elige la plantilla de `agent_business_config.config` y de precios por defecto
  según `vertical` (antes siempre insertaba la de detailing sin importar el valor
  recibido — ver Fase 0). Implementado como un mapa `BUSINESS_CONFIG_TEMPLATES`/
  `PRICING_TEMPLATES` en `validate_and_build_request`, con la plantilla de salón
  calcada del agente de prueba real de las Fases 1-3 (5 servicios, categoría de
  estilista Junior/Senior, `pricing_policy.requires_service_vehicle_district:
  false`, sin `agent_locations`). Se agregó validación
  `vertical ∈ {"detailing","salon"}` (antes aceptaba cualquier string sin avisar).
  Probado end-to-end con 3 llamadas reales al webhook: `vertical: "salon"` (10
  precios creados, config correcta), sin `vertical` (default detailing, 9 precios,
  cero regresión), `vertical` inválido (rechazado limpio, `error:
  "invalid_vertical"`, no crea nada).
- ⚠️ **Corrección importante**: este documento originalmente usaba
  `"salon_belleza"` como valor de `vertical` en varios lugares — el valor
  REAL, ya cableado en el mapa de despacho dinámico de `2 lead_loader` desde la
  Fase 0, siempre fue `"salon"` (minúscula, sin sufijo). Ya corregido en todo
  este documento. **Cualquier prompt/código para el panel debe usar `"salon"`
  literal** — un valor distinto cae silenciosamente al fallback de detailing sin
  error visible.
- 🔶 **Pendiente (lado Next.js, otro repo)**: selector de rubro en el formulario
  de alta, formulario condicional en el Editor de configuración, columna
  relabeled en el Editor de precios. Ver sección 5 de este documento para el
  contrato completo. `agent_locations` (multi-local) sigue fuera de alcance —
  el MVP de salón es de un solo local.

### Fase 5 — Evaluar el motor genérico

> ✅ **Ejecutada 2026-07-30.** El trigger que este documento anticipó ("si aparece
> un 3er o 4to rubro") se cumplió cuando el usuario pidió agregar más nichos.
> `3 rules_engine`/`3 rules_engine_salon` se consolidaron en un único motor
> config-driven (Fases A-G, ver memoria `project_multi_vertical`); salón corre
> hoy sobre ese motor único y un vertical sintético ("barbería") se probó de
> punta a punta agregándose **solo por configuración**, sin tocar
> `rules_evaluation`. `3 rules_engine_salon` quedó archivado (no borrado) en
> n8n. El párrafo original de abajo se deja como registro histórico de la
> decisión que se tomó en su momento (clonar primero, generalizar después).

- Si aparece un 3er o 4to rubro, recién ahí conviene medir cuánto se repite entre los
  motores clonados y decidir si vale la pena invertir en un motor único
  config-driven. Con solo 2 rubros, clonar es más rápido y más seguro que
  generalizar de más sin suficientes ejemplos reales para saber qué realmente varía.

## 7. Preguntas abiertas (definir antes de la Fase 1)

1. ¿El salón atiende en **un solo local**, en **varios locales**, o también
   **a domicilio**? (define si hace falta la tabla `agent_locations` de la sección
   5.3, o si se puede reusar `calendar_id`/`schedule` de `agent_business_config` como
   está, igual que un detailing de un solo operador).
2. ¿Hay **más de una estilista/profesional**? Si sí, `agent_staff` +
   `staff_selection_mode` ya existen y probablemente se reusan casi sin cambios.
3. ¿Los servicios tienen **precio fijo** o varían por algo (ej. largo de pelo,
   categoría de la estilista)? Define si la dimensión secundaria de precio
   (sección 5.4) se usa o queda `NULL` para todos.
4. ¿El salón usa **Flow / los mismos 4 modos de pago** ya construidos, o no cobra
   online? (si es que sí, no hay trabajo nuevo — `6.26`-`6.30` son genéricos).
5. ¿Un mismo cliente puede reservar **más de un servicio el mismo día** (ej. corte +
   manicure)? El soporte multi-reserva-por-lead arreglado hoy para "2 autos"
   aplicaría directo si la respuesta es sí.
6. ¿Nombre/dominio de servicios a incluir en el MVP (Fase 1, y en la plantilla por
   defecto del onboarding, sección 5.1)? (ej. corte, color, manicure, tratamiento
   facial...) — con 3-5 servicios de ejemplo alcanza para probar el motor nuevo antes
   de cargar el catálogo real completo.

## 8. Riesgos / notas

- El mayor riesgo no es técnico sino de alcance: es tentador "hacerlo bien de una" y
  generalizar el motor entero. Con un solo ejemplo real (salón) todavía no hay
  suficiente evidencia de qué es genuinamente igual entre rubros vs. qué solo se
  parece — clonar primero, generalizar después con datos reales de 2+ rubros en
  producción (Fase 5).
- Cualquier fix futuro a la mecánica compartida (pagos, calendario, cancelación)
  beneficia a **ambos** rubros automáticamente, sin trabajo extra — vale la pena
  seguir tratando esa capa como el activo más valioso a proteger de duplicación.
- El motor de reglas es grande y sensible (~200KB, ~50 funciones) — clonarlo significa
  mantener disciplina de qué helpers son genéricos (`normalizeText`,
  `buildRuleResult`, el manejo de `fields_to_clear`, `formatAppointmentWhen`, etc.,
  todos reusables tal cual) vs. qué es específico de detailing y debe reescribirse.
- El panel (sección 5) es aditivo sobre lo que `PANEL_BUILD_GUIDE`/`ONBOARDING_API`
  ya especifican — si esos documentos cambian, revisar que esta sección siga
  consistente con ellos.
