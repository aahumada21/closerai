# QA multiagente - Fase 9

Objetivo: validar que la capa multiempresa/multiagente no rompe el closer actual y que el QA observa `organization_id`, `agent_id`, `decision_action`, `tool_name` y `audit_ok`.

## Artefactos

- `QA/sql/qa_multiagent_380_389.sql`: fixtures + escenarios `569900380` a `569900389`.
- `scripts/qa_read_multiagent_results.ps1`: extractor resumido agent-aware.
- `workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json`: QA router ahora resuelve `agent_channels` por `phone_number_id`.
- `workflows/exports/uncategorized/9.1 - 9.1.1 qa_run_single_conversation__id-34092303-cb4a-4fd2-800e-ac16f650fc52.json`: runner ahora permite `source_metadata` por step y valida campos multiagente.

## Cobertura

1. `569900380`: Ahumada legacy sigue pasando.
2. `569900381`: Ahumada agent-aware resuelve agente.
3. `569900382`: numero no configurado no procesa.
4. `569900383`: numero configurado a agente inactivo no procesa.
5. `569900384`: agente lavado no mezcla polarizado.
6. `569900385`: agente polarizado no mezcla lavado.
7. `569900386`: agente sin calendar no ofrece agenda automatica.
8. `569900387`: agente sin pricing no confirma cotizacion inventada.
9. `569900388`: allowed actions cambia por agente.
10. `569900389`: auditoria incluye org/agent/tool.

## Comandos

```powershell
Get-Content .env | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object { $k,$v = $_ -split '=',2; [Environment]::SetEnvironmentVariable($k,$v,'Process') }

powershell -ExecutionPolicy Bypass -File scripts/qa_upload_scenario.ps1 -SqlFile "QA/sql/qa_multiagent_380_389.sql"

powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/uncategorized/9.0 - 9.0 qa_whatsapp_normalized_router__id-1badeb35-0335-4aaa-96a6-2e021376db8a.json"

powershell -ExecutionPolicy Bypass -File scripts/n8n_update_workflow_from_export.ps1 -ExportPath "workflows/exports/uncategorized/9.1 - 9.1.1 qa_run_single_conversation__id-34092303-cb4a-4fd2-800e-ac16f650fc52.json"

powershell -ExecutionPolicy Bypass -File scripts/qa_run_webhook.ps1 -BatchMode -TempPrefix "56990038" -TimeoutSec 900 -NoDisableAfterRun

powershell -ExecutionPolicy Bypass -File scripts/qa_read_multiagent_results.ps1 -FromKey "569900380" -ToKey "569900389" -OutputPath "QA/results/qa_multiagent_380_389.json"
```

## Resultado esperado por step

```json
{
  "passed": true,
  "agent_id": "...",
  "organization_id": "...",m
  "decision_action": "...",
  "tool_name": "...",
  "audit_ok": true
}
```

Nota: los casos negativos `569900382` y `569900383` esperan `should_process=false`; en esos steps es correcto que no exista `agent_id`, `tool_name` ni auditoria de `action_executor`.


