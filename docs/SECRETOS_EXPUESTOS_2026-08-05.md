# Secretos expuestos en el repositorio público — qué rotar

Fecha: 2026-08-05 · Estado: **archivos limpiados; rotación pendiente (requiere acción manual)**

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

## Lo que falta — rotación (no lo puedo hacer yo)

> **Quitar el secreto del archivo no lo des-publica.** Cualquiera pudo haberlo copiado
> mientras estuvo online, y sigue en el historial de git. **El único arreglo real es
> rotar.**

### 1. Tokens de Meta/WhatsApp — hacer primero

En Meta Business Suite → System Users → **revocar** los tokens comprometidos y generar
uno nuevo. Actualizar `META_ACCESS_TOKEN` en el entorno de n8n (`docker-compose.yml`
del servidor) y reiniciar.

Mientras no se revoquen, un tercero puede mandar WhatsApps como el negocio.

### 2. `ONBOARDING_API_TOKEN`

```bash
openssl rand -hex 32
```

Actualizar en el entorno de n8n **y** en el backend del panel (las dos puntas tienen
que coincidir o el onboarding deja de funcionar). Los 3 webhooks de onboarding fallan
cerrado con `missing_onboarding_token_config` si la variable falta, así que no hay
riesgo de quedar abierto por accidente.

### 3. `CHECK_CALENDAR_TOKEN`

Generar uno nuevo igual y setear `CHECK_CALENDAR_TOKEN` en el entorno de n8n. Hasta
entonces ese endpoint rechaza todo — que es lo correcto mientras el viejo siga siendo
público. Como no lo usa nadie, también es válido simplemente **desactivar el
workflow**.

### 4. `DISCONNECT_GOOGLE_CALENDAR_TOKEN`

Generar uno nuevo y actualizarlo en el entorno de n8n y en el panel.

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
