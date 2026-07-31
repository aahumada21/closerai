# Conexion de Google Calendar via OAuth (por agente)

Fecha: 2026-06-22

## Que hace

Reemplaza el flujo manual ("comparte tu calendario con esta cuenta de servicio
y pasame el `calendar_id` por chat") por un boton "Conectar tu Google Calendar"
en el panel. El negocio autoriza con su propia cuenta de Google, y el sistema
guarda un token que se puede renovar solo, sin que nadie comparta nada a mano.

Dos workflows nuevos en n8n:

1. **`google_calendar_oauth_callback`** (id `ulUOTFazrMcE2BdJ`, webhook GET
   `/webhook/google-calendar-oauth-callback`): recibe el `code` que devuelve
   Google despues de que el usuario autoriza, lo cambia por un `access_token`/
   `refresh_token`, identifica el email de la cuenta conectada, y guarda todo en
   `google_calendar_connections`. Responde con una pagina HTML simple que
   redirige de vuelta al panel.
2. **`get_fresh_google_calendar_token`** (id `J3IJloxxmbHiaJgf`, llamable via
   Execute Workflow con `{ agent_id }`): devuelve siempre un `access_token`
   valido para ese agente — si el guardado ya vencio, lo renueva solo contra
   Google antes de devolverlo. Devuelve `{ connected: false }` si ese agente
   nunca conecto un calendario propio.
3. **`disconnect_google_calendar`** (id `2FtwTlOI0mzbrXqR`, webhook POST
   `/webhook/disconnect-google-calendar`): desvinculado "duro" — revoca el
   token contra Google, borra la fila de `google_calendar_connections` y
   resetea `agents.google_calendar_connected`/`google_calendar_email`. Ver
   seccion "Desvincular un calendario" mas abajo para el contrato completo.

## Modelo de datos

- `agents.google_calendar_connected` (boolean) y `agents.google_calendar_email`
  (text): estado visible para el panel (ya tiene RLS de antes, se lee igual que
  cualquier columna de `agents`).
- `public.google_calendar_connections`: **tabla sin ninguna policy de RLS para
  `anon`/`authenticated`** (a proposito — guarda `refresh_token`/`access_token`
  de Google, secretos reales). Solo el rol privilegiado de n8n puede leerla o
  escribirla. El panel **nunca** debe intentar leer esta tabla directo; el
  estado "conectado si/no" se expone solo via `agents.google_calendar_connected`.

## Estado actual: falta un prerequisito externo (Google Cloud)

Igual que con Brevo/SMTP, hay un paso que **el usuario debe hacer el mismo**
porque requiere su propia cuenta de Google Cloud — no puedo crearlo yo:

### Pasos en Google Cloud Console

1. Ir a https://console.cloud.google.com/ y crear un proyecto nuevo (o usar uno
   existente si ya tienes uno para este negocio).
2. **APIs & Services > Library**: buscar "Google Calendar API" y habilitarla.
3. **APIs & Services > OAuth consent screen**:
   - Tipo: External (a menos que todo el uso sea con cuentas de un Workspace
     propio, en cuyo caso puede ser Internal).
   - Nombre de la app: algo como "AI Closer - Conexion de calendario".
   - Scopes a agregar: `https://www.googleapis.com/auth/calendar.events` y
     `https://www.googleapis.com/auth/userinfo.email` (calendar.events, no el
     scope completo `calendar` — solo necesitamos leer/escribir eventos, no
     gestionar configuracion ni permisos del calendario; esta en verificacion
     con Google al 2026-06-22).
   - Mientras la app este en modo "Testing", solo las cuentas de Google que
     agregues como "Test users" van a poder completar el flujo — agrega ahi el
     Gmail de cada negocio que vaya a conectar su calendario mientras no se
     publique/verifique la app. Para producir esto a varios clientes sin
     agregarlos uno por uno como test user, eventualmente hay que pasar la app
     a "In production" (Google puede pedir verificacion para el scope de
     calendar, que es un "sensitive scope").
4. **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - Tipo de aplicacion: "Web application".
   - Authorized redirect URIs: agregar exactamente
     `https://n8n.aahumada.com/webhook/google-calendar-oauth-callback`
   - Al crear, Google te muestra un **Client ID** y un **Client Secret**.
5. Setear esos dos valores como variables de entorno en el servidor de n8n
   (igual limitacion de siempre: no hay API de variables en esta licencia, hay
   que hacerlo a mano en el entorno del proceso de n8n):
   ```
   GOOGLE_CLIENT_ID=<el client id de google>
   GOOGLE_SECRET=<el client secret de google>
   ```

Hasta que esas dos variables existan en el entorno de n8n, el flujo va a fallar
al intentar cambiar el `code` por tokens (Google rechaza la llamada sin
`client_id`/`client_secret` validos). Avisame cuando las hayas configurado y
hago una prueba real conectando un calendario de prueba.

## Instrucciones para el panel Next.js ("Conectar tu Google Calendar")

El boton de "Conectar Google Calendar" en la pagina de un agente debe construir
y redirigir el navegador a esta URL (todo client-side, no necesita backend
propio para este paso — el `client_id` de Google no es secreto):

```ts
function buildGoogleCalendarConnectUrl(agentId: string, organizationId: string) {
  const state = btoa(JSON.stringify({ agent_id: agentId, organization_id: organizationId }));

  const params = new URLSearchParams({
    client_id: "<GOOGLE_CLIENT_ID>", // el mismo Client ID de Google Cloud, este SI es publico/seguro de exponer en el frontend
    redirect_uri: "https://n8n.aahumada.com/webhook/google-calendar-oauth-callback",
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",   // imprescindible: sin esto Google no entrega refresh_token
    prompt: "consent",        // imprescindible: fuerza que Google vuelva a entregar el refresh_token siempre, incluso en reconexiones
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// en el boton:
window.location.href = buildGoogleCalendarConnectUrl(agent.id, organization.id);
```

Despues de que el usuario autoriza en Google, termina de vuelta en
`https://closer.aahumada.com/agents/{agent_id}?calendar_connected=1` (lo arma
el workflow de n8n). El panel deberia, en esa pagina, simplemente volver a leer
`agents.google_calendar_connected`/`google_calendar_email` para reflejar el
estado actualizado — no hace falta que el panel haga nada mas con el query param
`calendar_connected`, es solo para que la pagina sepa que puede refrescar los
datos.

**Importante para el panel**: `state` no esta firmado criptograficamente en
esta primera version (es solo base64 de un JSON). El callback en n8n valida
que el `agent_id`/`organization_id` tengan formato UUID y que el agente
realmente pertenezca a esa organizacion antes de guardar nada, pero no verifica
que quien complete el flujo sea el mismo usuario que hizo click en el panel.
Para este caso de uso (el due o del negocio conectando su propio calendario) es
un riesgo bajo, pero si mas adelante se quiere endurecer, se puede firmar el
`state` con un HMAC usando un secreto compartido.

## Cableado a booking real: hecho (2026-06-22)

Los 3 workflows que hablan con Google Calendar ya tienen **camino dual**:

- `6.2 check_calendar_slot`, `6.3 create_calendar_booking`,
  `6.4 list_available_slots`: antes de llamar a Google, cada uno llama a
  `get_fresh_google_calendar_token` con el `agent_id` del lead. Si ese agente
  tiene un calendario conectado por OAuth, la llamada a Google se hace via
  HTTP Request directo con el token de esa cuenta (`calendars/primary/events`).
  Si no tiene conexion OAuth (caso de Ahumada y de cualquier agente nuevo que
  todavia no conecto nada), cae exactamente al camino de siempre: la
  credencial compartida de n8n ("Google Calendar account") con el
  `calendar_id` configurado en `agent_business_config`.
- Para que el `agent_id` llegue hasta ahi, tambien se agrego esa propagacion en
  los 3 workflows que llaman a estos: `6.5 confirm_booking_executor`,
  `6.10 reschedule_booking`, `6.23 offer_available_slots`.
- Validado que el camino de fallback (compartido) sigue intacto para Ahumada:
  confirmado en la base de datos que su agente no tiene fila en
  `google_calendar_connections`, asi que siempre toma la rama `false` del
  `IF oauth_connected` — cero cambio de comportamiento para el bot en
  produccion hoy.
- Detalle importante encontrado durante esta implementacion: hay 445 leads
  historicos sin `agent_id` asignado (de antes de que esa columna existiera).
  Si alguno de esos leads activa un flujo de booking, `get_fresh_google_calendar_token`
  ahora responde `{ connected: false }` en vez de lanzar un error — no rompe
  el flujo, simplemente usa el camino compartido de siempre.

Lo unico que falta para que esto funcione de punta a punta con un calendario
real es que exista el Google Cloud OAuth Client (seccion anterior) — sin eso,
nadie puede completar la conexion via OAuth todavia, pero el codigo que la va
a consumir ya esta desplegado y probado en su logica.

**Estado 2026-06-25: validado de punta a punta con una conexion real** —
calendario dedicado creado, reserva real agendada por el bot via webchat, y
confirmado con una llamada directa a la API de Google que el evento queda en
el calendario dedicado, no en el personal ni en el compartido.

## Desvincular un calendario

`agents.google_calendar_connected`/`google_calendar_email` los puede resetear
el panel directo (tiene RLS para editar `agents`), pero eso es un desvinculado
"suave": no revoca el token en Google ni borra la fila secreta en
`google_calendar_connections` (esa tabla no tiene policy para el rol
`authenticated`, a proposito). Para el desvinculado completo existe:

```
POST https://n8n.aahumada.com/webhook/disconnect-google-calendar
```

Headers:
```
Content-Type: application/json
X-Disconnect-Token: d6c5fad0125e05c1f422308715e35b2a972f1d69f38fef4910f65c3546a0d435
```

Body:
```json
{ "agent_id": "<uuid>", "organization_id": "<uuid>" }
```

Que hace, en orden, todo-o-nada (si revoke_failed, no toca la base de datos):
1. Verifica que `(agent_id, organization_id)` sea un agente activo real.
2. Busca la conexion en `google_calendar_connections` para ese agente.
3. Llama a `https://oauth2.googleapis.com/revoke` con el `refresh_token`
   guardado, para cortar el acceso tambien del lado de Google.
4. Si la revocacion funciona: **borra** (hard delete, no soft-delete — es la
   unica tabla del sistema donde se hace esto a proposito, porque guarda
   secretos y no tiene sentido dejar un token ya revocado "marcado inactivo")
   la fila de `google_calendar_connections` y resetea
   `agents.google_calendar_connected = false` /
   `agents.google_calendar_email = NULL`.

Respuesta (siempre HTTP 200, revisar `ok`):
```json
{ "ok": true }
{ "ok": false, "error": "agent_not_found" }
{ "ok": false, "error": "no_connection" }
{ "ok": false, "error": "invalid_disconnect_token" }
{ "ok": false, "error": "revoke_failed", "message": "..." }
```

Probado en vivo el 2026-06-25 contra la conexion real de prueba: los 3 casos
de error (`invalid_disconnect_token`, `agent_not_found`, `no_connection`)
responden exactamente como se espera, y se confirmo que un `revoke_failed`
real (Google rechazo revocar un token de prueba ya superado por tantas
reconexiones del mismo dia) **no modifica la base de datos** — la fila de
conexion y los campos de `agents` quedaron intactos, validando el
todo-o-nada. El camino de exito (revoke ok -> borrado -> reset de agents) se
valido por separado con la query real en una transaccion con rollback antes
de desplegar.

Token configurado en el entorno de n8n (mismo lugar que los demas, en el
`docker-compose.yml` del servidor):
```
DISCONNECT_GOOGLE_CALENDAR_TOKEN=d6c5fad0125e05c1f422308715e35b2a972f1d69f38fef4910f65c3546a0d435
```

Igual que con el resto de estos tokens: la llamada a este webhook debe
hacerse desde el servidor del panel (API route / server action), nunca desde
el navegador.
