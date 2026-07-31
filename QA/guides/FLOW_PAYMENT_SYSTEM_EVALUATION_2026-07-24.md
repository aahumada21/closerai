# Evaluación del sistema de pagos Flow — 2026-07-24

## Lo que ya tiene (sólido)

- Flujo completo: cotización → selección de medio de pago (`6.25`) → link de pago (`6.26`) → webhook de confirmación (`6.27`) → verificación de estado a pedido (`6.28`, agregado 2026-07-24).
- 4 modos de negocio configurables: `postpago_only`, `prepago_only`, `prepago_required`, `both`.
- El webhook de Flow **no confía ciegamente en el payload entrante**: al recibir la notificación, vuelve a consultar el estado real contra la API de Flow (firma HMAC propia) y solo confirma si Flow responde `status=2`. Evita que alguien falsifique una confirmación de pago.
- Idempotencia (reintentos del webhook de Flow no duplican la confirmación), manejo de errores HTTP (ya no devuelve 500 cuando Flow reporta un token inválido/no encontrado), self-heal cuando el bot detecta que Flow dice "pagado" pero la DB local no lo refleja.

## Qué le agregaría (orden de importancia)

1. **[RESUELTO 2026-07-24] Alta — reserva del cupo mientras se espera el pago.**
   Cuando el modo es `prepago_required`, el sistema no crea ni el evento de calendario ni una fila en `appointments` hasta que Flow confirma el pago (solo queda guardado en `lead_state`). Mientras el cliente tiene el link de pago abierto, ese horario sigue apareciendo disponible para otro cliente. Riesgo real de doble reserva, no hipotético.
   **Fix:** `6 action_executor` ahora crea el evento de calendario + fila `appointments` (`status='pending_payment'`) al momento de confirmar la reserva, antes de mandar el link. `6.29 release_expired_payment_holds` (cron cada 10 min) libera el cupo si no se paga dentro de 30 min. Detalle en `project_flow_payment.md`.

2. **[RESUELTO 2026-07-24] Alta — reconciliación proactiva (cron), no solo a pedido.**
   Hay 27 leads con `flow_order_id` en estado `pending` en la base, algunos desde el 10 de julio, sin resolverse. Hoy la única forma de corregir esto es que el cliente pregunte explícitamente "¿llegó mi pago?". Si nunca pregunta, queda pendiente para siempre. Un job programado (cada X horas) que recorra los `flow_order_id` pendientes y llame `getStatus` cerraría este vacío sin depender de que el cliente actúe.
   **Fix:** `6.30 reconcile_pending_payments` (cron cada 2h) revisa todo `flow_order_id` pendiente contra Flow y se auto-cura si detecta un pago confirmado que no se proceso; los pendientes de más de 7 días se marcan `expired` sin seguir consultando. Detalle en `project_flow_payment.md`.

3. **[RESUELTO 2026-07-24] Media — expiración del link de pago.**
   No hay TTL: si el cliente nunca paga, no hay recordatorio ("tu link vence en X horas") ni liberación automática del cupo reservado (relevante sobre todo combinado con el punto 1).
   **Fix:** liberación automática del cupo (30 min, vía `6.29`) y auto-expire de órdenes viejas (7 días, vía `6.30`) ya cubiertos por los puntos 1 y 2. Se agregó además un recordatorio proactivo (~15-20 min de antigüedad) para el hold de 30 min, antes de que se libere el horario — decisión explícita: solo para este caso (donde hay un horario real en juego), no para el pending general de 7 días.

4. **[RESUELTO 2026-07-24] Media — alertas cuando algo se traba.**
   No hay notificación (vía Telegram, como ya existe para QA) si un webhook falla repetidamente o si un pago queda "pending" más de N horas. Hoy uno se entera por casualidad (como con el email de alerta que reenvió Flow).
   **Fix:** workflow `Payment Error Alerts` (Error Trigger nativo de n8n) conectado a `6.26`/`6.27`/`6.28`/`6.29`/`6.30` — cualquier ejecución fallida en esos 5 avisa por Telegram automáticamente. Además, `6.30` avisa por Telegram (una sola vez) si un pago queda pendiente más de 24 horas. Ambos reutilizan el bot/webhook de Telegram que ya existía para QA, sin duplicar credenciales.

5. **Baja — reembolsos.**
   No hay integración con la API de reembolso de Flow. Si un cliente cancela después de pagar, hoy es un proceso manual fuera del bot.

## Qué tan importante es

Para el volumen actual (un solo negocio probando esto), el punto 2 (reconciliación) es el de mejor relación esfuerzo/impacto: relativamente simple de construir y cierra el hueco que ya está pasando ahora mismo con los 27 pagos pendientes.

El punto 1 (reserva del cupo) es el más grave estructuralmente, pero solo se vuelve crítico si crece el volumen de reservas `prepago_required` en paralelo — con uno o dos clientes a la vez el riesgo de colisión es bajo, pero crece con el volumen.

Los puntos 3-5 son mejoras de calidad, no bloqueantes.
