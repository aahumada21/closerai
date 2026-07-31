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

## Comandos útiles

### 1) Sincronizar workflows desde n8n
Sirve para bajar exports + reconstruir inventario local.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/n8n_sync_workflows.ps1
```

### 2) Subir un workflow exportado a n8n
Sirve para aplicar cambios de un JSON puntual a la instancia remota (update por `id`).
Nota: el parámetro correcto es `-ExportPath` (no `-FilePath`).
```powershell
powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/uncategorized/<archivo>.json"
```

### 2.1) Subir varios workflows de una vez (ejemplo flujos 1..6)
Sirve para publicar en lote cambios locales de los flujos principales.
```powershell
Get-ChildItem "workflows/exports/uncategorized" -Filter "*.json" | Where-Object { $_.Name -match '^\s*(1|2|3|4|5|6)(\.\d+)?\s-' } | ForEach-Object { powershell -ExecutionPolicy Bypass -File "scripts/n8n_update_workflow_from_export.ps1" -ExportPath $_.FullName }
```

### 3) Validar encoding/JSON de exports
Sirve para detectar archivos corruptos antes de subir/sincronizar.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_workflow_exports.ps1
```

### 4) Exportar últimas ejecuciones de flujos main (1..6)
Sirve para diagnóstico: baja las últimas ejecuciones y las ordena en carpetas `1 Exec`, `2 Exec`, ..., `6 Exec`.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/n8n_export_latest_executions.ps1 -PerWorkflow 10 -OnlyActiveMain
```
Salida:
- `workflows/executions_snapshot/<timestamp>/1 Exec/...`
- `workflows/executions_snapshot/<timestamp>/...`
- `workflows/executions_snapshot/<timestamp>/summary.json`

### 5) Subir escenarios QA a DB
Inserta escenarios en `public.qa_test_scenarios_temp` desde un `.sql`.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa_upload_scenario.ps1 -SqlFile "QA/sql/qa_scenario.sql"
```

### 6) Ejecutar QA por webhook del runner 9.1
Dispara el workflow `9.1 qa_conversation_test_runner` por webhook y deshabilita el escenario al terminar.
Requiere `N8N_QA_RUNNER_WEBHOOK_URL` y `SUPABASE_DB_URL` en `.env`.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa_run_webhook.ps1 -ScenarioKey "569900229"
```

### 7) Leer resultados QA relevantes
Obtiene el último `run_id` de un escenario (o usa uno explícito) y resume campos críticos de audit.
```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa_read_results.ps1 -ScenarioKey "569900229"
```

## Seguridad
- No comitear `N8N_API_KEY`.
- Si vas a ejecutar en CI, usa secrets del runner.
