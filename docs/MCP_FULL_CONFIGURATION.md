# MCP (n8n-mcp) — Full configuration para Codex (GPT‑5.2)

## Objetivo
Habilitar **todas** las capacidades del servidor `n8n-mcp`, incluyendo:
- Herramientas de documentación/descubrimiento/validación de nodos y templates.
- Herramientas de **gestión de n8n** (crear/actualizar/validar/ejecutar workflows) vía API de tu instancia.

## Requisito
Tener configurado en tu instancia de n8n:
- `N8N_API_URL`: URL base de tu n8n (sin `/api/v1`).
- `N8N_API_KEY`: API key de n8n (Settings → API).

## Codex (full configuration)
Edita tu archivo `~/.codex/config.toml` y agrega:

```toml
[mcp_servers.n8n]
command = "npx"
args = ["n8n-mcp"]
env = {
  "MCP_MODE" = "stdio",
  "LOG_LEVEL" = "error",
  "DISABLE_CONSOLE_OUTPUT" = "true",
  "N8N_API_URL" = "https://your-n8n-instance.com",
  "N8N_API_KEY" = "your-api-key"
}
```

Reemplaza:
- `https://your-n8n-instance.com` por la URL real de tu n8n
- `your-api-key` por tu API key real

## Notas
- Este repo incluye el código del servidor en `mcp/n8n/n8n-mcp/`, pero la configuración recomendada para Codex usa `npx n8n-mcp` en modo `stdio`.
- No guardes claves reales en el repo. Mantén `N8N_API_KEY` fuera de control de versiones.

