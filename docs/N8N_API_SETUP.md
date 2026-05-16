# n8n API — Configuración para sincronizar workflows

## Variables de entorno requeridas
- `N8N_API_URL`: URL base de tu instancia n8n (sin `/api/v1`).
  - Ejemplo: `https://n8n.tudominio.com`
- `N8N_API_KEY`: API key de n8n (Settings → API).

## Sync de workflows (exports + inventario)
Script: `scripts/n8n_sync_workflows.ps1`

Ejemplo (PowerShell):
```powershell
$env:N8N_API_URL="https://n8n.aahumada.com"
$env:N8N_API_KEY="N8N_API_KEY"
pwsh -File scripts/n8n_sync_workflows.ps1
```
Salida esperada:
- Exports JSON en `workflows/exports/<categoria>/...`
- Inventario en `workflows/catalog/workflows.inventory.json`

## Seguridad
- No comitear `N8N_API_KEY`.
- Si vas a ejecutar en CI, usa secrets del runner.

