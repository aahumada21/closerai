# Secretos expuestos en el repositorio público — qué rotar

Fecha: 2026-08-05 · Estado: **archivos limpiados y 3 de 4 tokens rotados. Falta:
revocar los de Meta (requiere Meta Business Suite) y cargar los nuevos en el panel.**

## Qué pasó

Este repositorio es **público** (`github.com/aahumada21/closerai`, `"private": false`,
verificado por la API de GitHub). Tenía credenciales reales escritas en texto plano
dentro de archivos versionados, o sea legibles por cualquiera en internet.

Se detectaron escaneando los 1.670 archivos trackeados por git.

## Los 4 secretos, por gravedad

| # | Secreto | Dónde estaba | Gravedad |
|---|---|---|---|
| 1 | **5 access tokens de Meta/WhatsApp** | `docs/arquitectura/archivo/ai_closer_flujos_workflow.md` | 🔴 crítica |
| 2 | `ONBOARDING_API_TOKEN` | `docs/ONBOARDING_API_2026-06-22.md` | 🔴 crítica |
| 3 | Token de `check_calendar_token` | **hardcodeado en el código** del workflow (activo) | 🟠 alta |
| 4 | `DISCONNECT_GOOGLE_CALENDAR_TOKEN` | `docs/GOOGLE_CALENDAR_OAUTH_2026-06-22.md` | 🟠 alta |

Por qué esa gravedad:

1. **Meta/WhatsApp**: permiten **enviar mensajes de WhatsApp en nombre del negocio**.
   Es lo peor de la lista: suplantación directa frente a clientes reales.
2. **`ONBOARDING_API_TOKEN`**: es la única autenticación de `onboarding-create-agent`,
   `onboarding-add-channel` y `onboarding-manage-service`. Con él se pueden crear
   agentes, **reasignar el número de WhatsApp de un cliente a otro agente**
   (`add-channel` hace `ON CONFLICT DO UPDATE` a propósito) y cambiar catálogos y
   precios. **Confirmado que estaba vivo**: se usó con éxito contra esos webhooks el
   2026-08-02.
3. **`check_calendar_token`**: ese endpoint lee y refresca tokens de Google Calendar
   de los agentes. No es un simple health check.
4. **`DISCONNECT_GOOGLE_CALENDAR_TOKEN`**: permite desconectar el Google Calendar de
   un agente.

## Lo ya hecho (2026-08-05)

- Los 4 salieron de los archivos del working tree, reemplazados por placeholders con
  una advertencia en cada archivo.
- El caso 3 era el único en **código de producción**: `check_calendar_token` ahora lee
  `$env.CHECK_CALENDAR_TOKEN` y **falla cerrado** si esa variable no existe. Se
  verificó antes que ese workflow **no tiene ninguna ejecución registrada**, así que
  no rompe nada en uso.
- También se purgó del backup versionado que lo contenía.

## Rotación ejecutada (2026-08-05 17:53 UTC)

Se rotaron **3 de los 4** en el entorno de n8n (`/root/n8n-docker/docker-compose.yml`,
con backup previo `docker-compose.yml.bak-pre-rotacion-secretos-*`) y se recreó el
contenedor:

| Token | Estado |
|---|---|
| `ONBOARDING_API_TOKEN` | ✅ rotado |
| `DISCONNECT_GOOGLE_CALENDAR_TOKEN` | ✅ rotado |
| `CHECK_CALENDAR_TOKEN` | ✅ creado (no existía) |
| `META_ACCESS_TOKEN` | ⛔ **no se puede rotar desde acá** — ver abajo |

**Verificado después del reinicio**, no asumido:

- el token viejo (el que estuvo público) ahora devuelve `invalid_onboarding_token`;
- sin token, lo mismo;
- el token nuevo **sí autentica** — pasa el chequeo y falla recién en la validación
  de negocio (`agent_not_found` con un `agent_id` inventado), que es exactamente lo
  esperado;
- el bot sigue vivo: escenario de QA `569900050` corrido después del reinicio, 4/4
  pasos OK.

La rotación no interrumpió nada en uso: las únicas ejecuciones que tenían esos
webhooks eran pruebas propias, el panel todavía no los consume en producción.

### Buena noticia sobre Meta

El `META_ACCESS_TOKEN` **vivo en producción no es ninguno de los 3 filtrados**
(comparado por hash SHA-256, sin exponer valores: el vivo da `c3213662…`, los
filtrados `15890769…`, `c00d6ff8…`, `d62c36da…`). Comparten el prefijo
`EAASP3nLrIZ`, o sea que son de la misma app de Meta, pero son tokens más viejos.

Eso baja la urgencia, **pero no la elimina**: si esos tokens siguen siendo válidos
(son de tipo system user, que no expiran solos), cualquiera puede usarlos. Hay que
revocarlos igual.

### Pendiente para el panel

Los valores nuevos de `ONBOARDING_API_TOKEN` y `DISCONNECT_GOOGLE_CALENDAR_TOKEN`
quedaron en `C:\Dev\shared-claude\TOKENS_ROTADOS_2026-08-05.md` para cargarlos en el
backend del panel. Mientras no se carguen, el panel no puede llamar a esos webhooks
(hoy no los llama, así que no hay nada roto).

## Lo único que falta y NO puedo hacer yo

### Revocar los tokens de Meta/WhatsApp

Requiere Meta Business Suite (login con la cuenta de Facebook del negocio), a lo que
no tengo acceso.

**Meta Business Suite → Configuración del negocio → Usuarios del sistema →** revocar
los tokens comprometidos. Si alguno de los 3 filtrados sigue activo, cualquiera que
los haya copiado puede enviar WhatsApps en nombre del negocio.

El token que usa producción hoy es distinto (ver arriba), así que revocar los viejos
**no interrumpe el bot**. Si igual se quiere rotar el de producción, generar uno nuevo
ahí mismo y reemplazar `META_ACCESS_TOKEN` en
`/root/n8n-docker/docker-compose.yml`, después `docker compose up -d`.

## Sobre el historial de git

Los valores viejos siguen en commits anteriores. Reescribir el historial
(`git filter-repo`, BFG) es posible pero:

- obliga a un `push --force` que rompe cualquier clon existente, y
- **no recupera nada**: lo que estuvo público, público quedó (GitHub cachea, hay
  scrapers, forks).

Por eso **la prioridad es rotar, no reescribir**. Una vez rotados, los valores del
historial no sirven para nada y limpiar el historial pasa a ser cosmético.

## Para que no vuelva a pasar

- Ningún secreto en archivos del repo: van en el entorno del servidor
  (`docker-compose.yml`) y en el del panel.
- En la documentación, el nombre de la variable sí; el valor **nunca**.
- Vale la pena correr un escaneo antes de publicar. El que se usó acá quedó en
  `scripts/` como referencia si se quiere automatizar (ver también
  `git secrets` o `gitleaks` como pre-commit hook).
- Antes de hacer público un repo que ya tiene historia, escanearlo entero.
