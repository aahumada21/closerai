# Health-check operativo por agente

Fecha: 2026-06-22

## Que hace

Workflow `health_check_agents` (id `ZgKBBYK2ZUyNIM7r`), corre cada 30 minutos
(Schedule Trigger), revisa **todos los agentes activos** y detecta:

1. **Config incompleta** (extension de la query de checklist de
   `docs/PER_NUMBER_CONFIG_GUIDE_2026-06-20.md`):
   - `missing_channel`: sin canal activo (WhatsApp/webchat) conectado.
   - `missing_business_config`: sin `agent_business_config` activa.
   - `no_schedule`: tiene config activa pero `schedule` vacio (no puede ofrecer horas).
   - `missing_pricing`: sin `pricing_versions` activa (no puede cotizar).
   - `missing_calendar`: sin `calendar_id` propio y sin `agent_staff` activo
     (no puede agendar).
2. **Cliente sin respuesta** (`no_response_gap`): mensajes inbound de las ultimas
   24h que llevan mas de 15 minutos sin una respuesta outbound — el caso real que
   esta guia busca prevenir ("te enteras porque el cliente escribe y no le
   contestan").
3. **Fallas de envio** (`failed_messages`): mensajes outbound con `status = 'failed'`
   en las ultimas 24h (canal caido, numero invalido, rate limit, etc).

No verifica todavia si el calendario de Google realmente tiene huecos libres
(eso requeriria llamar la API de Google por cada agente cada 30 min); por ahora
`missing_calendar` solo detecta "no hay ningun calendario configurado", no
"el calendario esta lleno". Queda como mejora futura.

## Modelo de datos

`public.organizations` ahora tiene:
- `alert_whatsapp_number` (text, nullable): numero que recibe las alertas por WhatsApp.
- `alert_email` (text, nullable): correo que recibe las alertas por email.

Si una organizacion no tiene estos campos seteados, sus alertas se siguen
guardando en `health_alerts` (para que el futuro panel las muestre) pero no se
manda notificacion en tiempo real — evita espamear organizaciones que todavia no
configuraron a quien avisar.

`public.health_alerts` (RLS: solo lectura para miembros de la organizacion via
`organization_members`, igual patron que el resto de tablas multi-tenant):

```
id, organization_id, agent_id, check_key, severity, message, details (jsonb),
status ('open' | 'resolved'), first_detected_at, last_detected_at, resolved_at,
notified_whatsapp_at, notified_email_at
```

Una fila por `(agent_id, check_key)` — si el mismo problema sigue presente, se
actualiza `last_detected_at` en vez de crear una fila nueva. Si el problema se
soluciona solo (por ejemplo, alguien activa una `pricing_version` nueva), la
fila se marca `resolved` automaticamente en el siguiente ciclo de 30 minutos.

## Logica de notificacion (anti-spam)

Solo se manda WhatsApp/email cuando una alerta **recien se abre** (no existia o
estaba `resolved` y volvio a fallar) — si sigue abierta de un ciclo a otro, no se
vuelve a notificar. Esto evita mandar el mismo aviso cada 30 minutos mientras el
problema no se resuelve. Si quieres un recordatorio periodico para alertas viejas
sin resolver, hay que agregarlo aparte (no esta implementado todavia).

## Configuracion pendiente (manual, una sola vez)

El nodo de email (`EMAIL send_alert`) necesita una credencial SMTP que **el
usuario debe crear directamente en la UI de n8n** (no expongo claves SMTP en
este chat por seguridad). Se decidio usar Brevo en vez de Gmail. Pasos:

1. En Brevo: Settings (engranaje) > SMTP & API > pestana "SMTP" > copiar el
   `SMTP Server`, `Port`, `Login` (es tu correo de cuenta Brevo) y generar/copiar
   una `SMTP key` (no es la contrasena de tu cuenta Brevo, es una clave aparte
   que Brevo genera para esto).
2. En n8n: Credentials > New > buscar "SMTP".
3. Host: `smtp-relay.brevo.com`, Port: `587`, Secure: `false`,
   Disable STARTTLS: `false` (STARTTLS habilitado, es como opera Brevo en el 587).
4. User: el `Login` SMTP de Brevo (tu correo de cuenta). Password: la `SMTP key`
   generada en el paso 1.
5. Guardar con un nombre claro, ej. `Brevo SMTP alerts`.
6. En Brevo tambien hay que **verificar el dominio o el correo remitente**
   (`alertas@aahumada.com`, que es el `fromEmail` que ya configure en el nodo)
   bajo Senders & IP / Domains, si no Brevo puede rechazar el envio o marcarlo
   como no autenticado.
7. Avisarme el nombre exacto que le pusiste a la credencial — yo conecto el nodo
   `EMAIL send_alert` a esa credencial y activo el workflow.

**Estado actual (2026-06-22): hecho.** Credencial `Brevo SMTP alerts`
(id `AZEOxOIAUcZMGToA`) conectada al nodo `EMAIL send_alert`, workflow
**activo**. Si Brevo rechaza el envio por remitente no verificado, revisar
Senders & IP / Domains en Brevo para `alertas@aahumada.com`.

Mientras tanto, el workflow ya tiene todo lo demas listo y probado contra la
base de datos real (en una transaccion de prueba con rollback, sin tocar datos):
deteccion de fallas, estado open/resolved, envio de WhatsApp al numero configurado
por organizacion.

## Numero/correo de alerta configurados hoy

Ahumada Detailing (`organization_id = 0f709b9c-23b3-4fd5-9fd5-db11a767d364`):
- WhatsApp: `56930977617`
- Email: `contacto@aahumada.com`

Cualquier organizacion nueva que se cree (por ejemplo via el endpoint de
onboarding, `docs/ONBOARDING_API_2026-06-22.md`) no tendra estos campos seteados
por defecto — hay que agregarlos a mano (`UPDATE organizations SET
alert_whatsapp_number = ..., alert_email = ... WHERE id = ...`) o exponerlos en
el panel cuando se construya, para que cada negocio reciba sus propias alertas.
