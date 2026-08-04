# Reservas retenidas por pago (holds) — por qué nunca se liberaban

Fecha: 2026-08-04 · Estado: **corregido y desplegado**

## El síntoma

27 reservas con el pago vencido seguían ocupando la agenda. El cron que debería
liberarlas, `6.29 release_expired_payment_holds`, estaba **activo y corriendo cada
10 minutos sin fallar** — pero terminaba en 0,4 s sin hacer nada.

## La causa: dos representaciones que nunca se cruzaban

`6.29` buscaba así:

```sql
WHERE a.status = 'pending_payment'
```

Ese valor **no existe en la tabla**. Los únicos estados reales de `appointments`
son `confirmed` (284) y `cancelled` (170), y el default de la columna es
`'confirmed'`.

La intención original sí está implementada:
`6 action_executor :: build_pending_payment_appointment_payload` arma el payload con
`status: "pending_payment"`, y el nodo `insert_pending_payment_appointment` lo mapea
correctamente. Pero esa rama nunca insertó nada. En la práctica, las reservas las
crea `6.5 confirm_booking_executor`, cuyo
`build_real_appointment_payload` fija `status: "confirmed"` — incluso cuando el pago
todavía está pendiente.

Entonces el estado del pago vive en **`lead_state`**, no en `appointments`:

```
6.30 reconcile_pending_payments  →  UPDATE lead_state SET payment_status='expired'
6.29 release_expired_payment_holds  →  busca appointments.status='pending_payment'  ✗
```

**6.30 marcaba el vencimiento y 6.29 nunca se enteraba.** La cadena estaba cortada
en el medio.

La rama de recordatorios (`find_holds_needing_reminder`) tenía exactamente el mismo
filtro, así que los avisos previos al vencimiento tampoco se enviaron nunca.

## Segundo bug: borraba del calendario equivocado

`delete_expired_calendar_event` tenía `calendar: "primary"` hardcodeado — el
calendario principal de la credencial compartida de n8n, no el del agente. Aunque la
query hubiera encontrado algo, habría intentado borrar del calendario de otro tenant
(el mismo problema de [`AISLAMIENTO_CALENDARIO.md`](AISLAMIENTO_CALENDARIO.md)).

## La corrección

Las dos queries aceptan **ambas** representaciones — se conserva la original por si
esa ruta se activa algún día:

```sql
AND (
  a.status = 'pending_payment'
  OR (a.status = 'confirmed'
      AND ls.stage = 'booked_pending'
      AND ls.payment_status = 'expired')
)
```

Más tres decisiones:

- **Solo citas futuras** (`a.start_at > NOW()`): una cita pasada ya no ocupa cupo y
  borrarla solo destruiría historial.
- **Solo agentes con calendario propio** (`config->>'calendar_id' <> ''`): sin eso no
  se toca nada, en vez de caer en `"primary"`.
- El nodo de borrado usa `{{ $json.calendar_id }}`, resuelto por agente en la query.

## Trampa encontrada al desplegar (vale la pena recordarla)

El primer despliegue **rompió el cron**. La query nueva empezaba con un bloque de
comentarios `--` antes del `SELECT`, y con eso el nodo Postgres de n8n emite un item
`{success: true}` en vez de **cero** items cuando no hay filas. La cadena entonces
seguía corriendo con `appointment_id` undefined y reventaba en
`mark_appointment_cancelled` con `column "undefined" does not exist`.

No alcanzó a hacer daño (verificado: 0 canceladas, 257 confirmadas intactas), pero
deja una lección concreta:

> En los nodos Postgres de n8n, **la query debe empezar con `SELECT`**. Los
> comentarios explicativos van *dentro* del statement (entre el `SELECT` y el `;`),
> nunca antes: ahí cambian lo que el nodo emite cuando no hay resultados, y los nodos
> siguientes corren igual con valores `undefined`.

Esto además expone una fragilidad preexistente del workflow: la cadena
`find → delete → mark → clear` no tiene ningún guard entre medio, así que cualquier
cosa que haga emitir un item vacío la hace correr con datos indefinidos. Se dejó como
está (no se cambió la topología), pero conviene tenerlo presente.

## Limpieza de lo acumulado

Los 29 registros que quedaron colgados (`stage='booked_pending'`,
`payment_status='expired'`) eran **todos de QA** — ni un cliente real atrapado. Se
limpiaron con exactamente la misma lógica que aplica el cron
(`clear_lead_state_pending_hold`), para que el estado final sea idéntico al que
producirá de ahora en más, y sus 27 citas ya pasadas quedaron marcadas como
canceladas.

> Nota: `clear_lead_state_pending_hold` **no resetea `stage`**, así que el lead queda
> en `booked_pending` sin reserva. Es inconsistente con el vocabulario documentado en
> [`ESTADOS_LEAD_STATE.md`](ESTADOS_LEAD_STATE.md) y sería razonable devolverlo a
> `quoted`. No se cambió en esta pasada para no alterar el comportamiento del cron más
> allá del bug reportado.

## Estado final

- `payment_status='expired'` pendientes: **0**
- El cron sigue activo cada 10 min; con 0 coincidencias vuelve a terminar sin hacer
  nada, como corresponde.
- Backup previo: `workflows/backups/pre_629_fix_2026-08-02/`.
