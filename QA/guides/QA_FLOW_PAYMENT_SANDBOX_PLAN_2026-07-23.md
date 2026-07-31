# Plan de pruebas — Flow.cl sandbox (6.25 / 6.26 / 6.27)

Categoria nueva: `pagos`. Prefijo `5693600000`. Credenciales sandbox provistas por el
usuario el 2026-07-23 (API key/secret de una cuenta sandbox de Flow.cl creada para
este proposito).

## Punto de disparo real (verificado leyendo el codigo, no asumido)

`6.26 payment_request` **no** se dispara desde `rules_engine` como una `action` propia
(el `action_router` de `6 action_executor` solo tiene 20 salidas, 0-19, y la ultima
(`19`) es `ask_payment_preference` -> `6.25`; no hay salida para `6.26`). Se dispara
**internamente**, dentro del propio `action_executor`, en la cadena que sigue a
`confirm_booking`:

```
action_router[5] confirm_booking
  -> IF skip_calendar_booking (true SOLO si payment_mode === "prepago_required")
     -> [false, caso actual "prepago_only"] 6.5 confirm_booking_executor (crea el evento GCal YA)
        -> extract_booking_confirm_result
        -> IF payment_preference_prepago (true si payment_preference === "prepago")
           -> 6.26 payment_request  <-- ACA se genera el link real
     -> [true, caso "prepago_required", no es el modo actual] prepago_required_prep
        -> (salta GCal, pide el pago primero; el evento se crea recien en 6.27 tras
           confirmar el pago)
```

Con `payment_mode=prepago_only` (el modo real de produccion hoy), el flujo relevante
para probar es la rama FALSE: reservar normalmente -> el evento de calendario se crea
de inmediato -> **despues** se envia el link de pago (no bloqueante).

## Que se puede probar y que no, dado el modo actual (`prepago_only`)

- **`6.26` (generar link + enviarlo)**: totalmente probable end-to-end contra sandbox,
  encadenando un flujo de reserva completo (igual patron que `base`).
- **`6.27` (webhook de confirmacion de Flow.cl)**: probable simulando el callback real
  con `curl` contra el webhook de n8n, usando el `flow_order_id` real que devuelva el
  paso anterior contra sandbox.
- **`6.25` (la PREGUNTA "como prefieres pagar")**: **no** es alcanzable con
  `payment_mode=prepago_only` -- la regla auto-selecciona y nunca pregunta (ver
  `QA/decision_tree/README.md`, seccion "Investigacion de sandbox Flow.cl"). Probarla
  de verdad requeriria cambiar `payment_mode` a `"both"` en `agent_business_config`,
  que es la config REAL de produccion (afectaria clientes reales mientras dure la
  prueba). **No incluido en este plan** salvo que el usuario apruebe explicitamente
  ese cambio temporal.
- **`prepago_required`** (la rama que SI bloquea el calendario hasta que se pague): no
  es el modo actual, mismo problema que arriba si se quisiera probar tal cual.

## Escenarios propuestos (prefijo `5693600000`)

### `5693600001` — Reserva con prepago: link generado y enviado (feliz, sandbox)

Flujo de reserva completo (mismo patron ya probado en `base`) + verificacion de que el
mensaje final incluye un link de pago real de Flow.cl **sandbox** (no produccion).

| # | Mensaje | accion esperada | Verificacion extra |
|---|---|---|---|
| 1-6 | (flujo de agenda completo, igual a `5693300001` de base) | ... hasta `confirm_booking` | - |
| 7 (parte del paso 6, ver nota) | — | `confirm_booking` | `response_includes_any: ["flow.cl", "link de pago"]` en el mensaje final, y verificacion posterior via SQL de `lead_state.flow_order_id`/`flow_payment_url` (no nulos, y la URL debe apuntar a `sandbox.flow.cl`, NO a `www.flow.cl`, para confirmar que realmente uso el ambiente sandbox) |

**Nota**: el link de pago puede llegar como un mensaje SEPARADO (async, despues de que
`confirm_booking` ya respondio) porque `6.26` se llama recien despues de que el GCal se
crea -- el QA runner (`9.1.1`) solo captura la respuesta INMEDIATA del paso. Puede hacer
falta un paso 8 extra ("¿ya tengo mi link?" o similar) o una verificacion directa a la
tabla `messages`/`lead_state` por fuera del `expect` normal, revisando unos segundos
despues del paso 6.

### `5693600002` — Webhook de Flow.cl confirma el pago (sandbox)

No es un escenario de conversacion (no pasa por `9.1.1`) -- es una llamada HTTP directa
simulando el callback de Flow.cl, usando el `flow_order_id` que haya quedado pendiente
del escenario anterior (o uno generado ad-hoc contra sandbox para este test).

Pasos (ejecutados a mano / con un script, no con el runner de conversaciones):

1. Confirmar en sandbox de Flow.cl (via su API `payment/getStatus` o su panel) que la
   orden esta en estado pagado -- o, si sandbox permite forzar el estado de una orden
   de prueba, usar eso.
2. `POST` al webhook real de n8n (`/webhook/flow-payment-confirmed`) con el
   `token`/`commerceOrder` correspondientes, replicando el payload que Flow.cl
   realmente envia.
3. Verificar: el bot le manda al lead un mensaje de "pago confirmado", `lead_state`
   pasa a `payment_status='paid'`, y (dado que en `prepago_only` el GCal ya se creo
   antes) NO debe re-crear el evento -- solo debe confirmar.
4. **Prueba de idempotencia**: repetir el mismo `POST` una segunda vez. Debe responder
   `{status:'ok', already_processed:true}` sin re-enviar el mensaje de confirmacion ni
   tocar `lead_state` de nuevo (ver el guard `IF already_paid` agregado el 2026-07-18).

### `5693600003` (opcional, solo si el usuario aprueba tocar `payment_mode` temporalmente)

Si en algun momento se decide probar `prepago_required` o la pregunta de `6.25`
directamente, haria falta:
1. Confirmar con el usuario el cambio temporal de `payment_mode` en
   `agent_business_config` (afecta clientes reales mientras dure).
2. Correr el escenario.
3. Revertir el `payment_mode` al valor original inmediatamente despues.

No se arma el detalle de este escenario hasta tener luz verde explicita, dado el
impacto en produccion real.

## Resultado (2026-07-23/24)

**Ejecutado completo, 4 bugs reales encontrados y arreglados, todos verificados
end-to-end contra Flow.cl sandbox con pagos reales (tarjeta de prueba oficial).**

- **Infra**: `FLOW_API_URL`/`FLOW_API_KEY`/`FLOW_SECRET_KEY` cambiados a sandbox en
  `/root/n8n-docker/docker-compose.yml` del VPS, contenedor `n8n` reiniciado (backup
  del compose original guardado antes de tocar nada). Al terminar las pruebas, se
  revirtio al compose de produccion original y se reinicio de nuevo -- confirmado
  `FLOW_API_URL=https://www.flow.cl/api` activo otra vez, 54/54 workflows activos post-restore.
- **`5693600001`**: 6/6 pasos de conversacion OK. Encontro el bug de
  `payment_preference` nunca seteado (ver detalle abajo) -- sin ese fix, `6.26` nunca
  se llegaba a llamar en el flujo normal de reserva.
- **Verificacion manual del pago real** (no automatizable via QA runner, requeria
  completar un checkout real): el usuario completo 2 pagos de prueba distintos contra
  sandbox con la tarjeta oficial de Flow.cl (`4051 8856 0044 6623`). El primero expuso
  3 bugs encadenados en `6.27` (uno por intento, cada fix revelaba el siguiente). El
  segundo pago confirmo el flujo completo limpio: link generado -> pago -> webhook de
  confirmacion -> mensaje "Pago confirmado!" recibido por WhatsApp Y persistido en
  `messages` -> reintento del mismo webhook devuelve `already_processed:true` sin
  duplicar nada.
- **Verificacion de impacto en clientes reales**: se consulto la API real de Flow.cl
  PRODUCCION (`getStatusByFlowOrder`) para las 24 ordenes historicas en
  `lead_state.flow_order_id` -- las 24 tienen `status=1` (nunca pagadas) y
  `payer=contacto@aahumada.com` (email de fallback, no un cliente real). Ningun
  cliente real quedo con un pago sin confirmar por estos bugs, pero el riesgo era
  real: el codigo roto era identico en sandbox y produccion.

**4 bugs reales encontrados y arreglados** (detalle completo con before/after en
`known_gaps` de `action_subflows.yaml`):
1. `rule_show_me_slots_after_quote` nunca seteaba `payment_preference` para
   auto-select modes (`prepago_only`/`postpago_only`/`prepago_required`) -- fix con
   una red de seguridad en `extract_booking_confirm_result` (action_executor).
2. `6.27/find_lead_by_order`: expresion de n8n corrupta (`{{ \.commerceOrder }}`,
   sintaxis invalida) + campo equivocado (debia ser `flowOrder`, no `commerceOrder`).
3. `6.27/build_confirmation_msg`: no ponia `channel`/`phone`/`message` en la raiz del
   payload que espera `6.1/validate_outbound_input`.
4. `6.27/build_confirmation_msg`: leia su input del nodo Postgres inmediatamente
   anterior (`update_payment_confirmed`, un UPDATE sin RETURNING) en vez de
   `$("find_lead_by_order").first().json` -- perdia lead_id/phone en el camino.
5. (menor) `6.27` nunca persistia el mensaje de confirmacion en `messages` (se
   enviaba de verdad, pero no quedaba en el historial) -- nodo nuevo
   `insert_confirmation_message` agregado, mismo patron que `6.26`.

**Pendiente real, no arreglado hoy**: la pregunta explicita de `6.25` (modo `both`)
sigue sin poder probarse sin cambiar `payment_mode` de produccion temporalmente --
mismo criterio que antes, requiere luz verde explicita aparte.

## Pendiente antes de ejecutar cualquier cosa (contexto historico, ya resuelto)

1. **Configurar el ambiente sandbox en el servidor n8n de produccion**: setear
   `FLOW_API_URL=https://sandbox.flow.cl/api` (a confirmar la URL exacta con la
   documentacion de Flow.cl), `FLOW_API_KEY`/`FLOW_SECRET_KEY` = los valores sandbox
   provistos por el usuario, y reiniciar el servicio de n8n. **Esto es un cambio de
   infraestructura en un servidor que atiende clientes reales -- requiere confirmacion
   explicita antes de ejecutar**, aunque solo afecta las llamadas salientes a Flow.cl
   (no deberia afectar el resto del bot).
2. Confirmar que el email/telefono usados por los leads de QA (`prepare_qa_lead` en
   `9.1.1`) sean validos para la API de Flow.cl (exige un email con formato valido) --
   si no, `6.26` fallaria en el paso de creacion de la orden por un motivo ajeno a lo
   que se quiere probar.
