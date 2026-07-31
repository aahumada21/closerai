param(
  [Parameter(Mandatory = $true)]
  [string]$ExportPath,

  [Parameter(Mandatory = $true)]
  [string[]]$BugScenarioKeys,

  [string[]]$RegressionScenarioKeys,

  [string]$BugId = "bug",

  [int]$PerScenarioWaitSeconds = 15,

  [int]$JudgeTimeoutSec = 240,

  [switch]$SkipBackup,

  [switch]$SkipRollbackOnRegression
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Harness para aplicar un fix a un workflow exportado y validarlo "sin fallar":
# 1. Respalda el workflow EN VIVO antes de tocar nada.
# 2. Sube el export nuevo (con el fix ya aplicado por el dev).
# 3. Corre los escenarios QA del bug puntual + el set de regresion (20 BASE
#    happy-path por defecto).
# 4. Si CUALQUIER escenario de regresion deja de pasar -> rollback automatico
#    al backup y exit code distinto de cero. Si solo el bug puntual sigue
#    fallando, NO se hace rollback (no es una regresion nueva), se reporta y
#    sigue.
#
# Uso:
#   scripts/qa_fix_harness.ps1 `
#     -ExportPath "workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-....json" `
#     -BugScenarioKeys @("569900507","569900509","569900510") `
#     -BugId "BUG-06"

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#') -or $line -notmatch '=') { return }
    $parts = $line -split '=', 2
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
  }
}

function Require-Env([string]$Name) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Falta variable: $Name" }
  return $v.Trim()
}

Import-DotEnv ".env"

$n8nBaseUrl = (Require-Env "N8N_API_URL").TrimEnd('/')
$n8nApiKey = Require-Env "N8N_API_KEY"
$dbUrl = Require-Env "SUPABASE_DB_URL"

if (-not (Test-Path $ExportPath)) {
  throw "No existe ExportPath: $ExportPath"
}

if (-not $RegressionScenarioKeys -or $RegressionScenarioKeys.Count -eq 0) {
  # 20 BASE happy-path por defecto (569900500-569900519): deben pasar siempre.
  $RegressionScenarioKeys = 500..519 | ForEach-Object { "569900$_" }
}

$headers = @{
  "X-N8N-API-KEY" = $n8nApiKey
  "Accept" = "application/json"
}

$exportJson = Get-Content -Raw $ExportPath | ConvertFrom-Json
$workflowId = "$($exportJson.id)"
if ([string]::IsNullOrWhiteSpace($workflowId)) {
  throw "El export no contiene id: $ExportPath"
}

Write-Host "=== Harness QA fix: $BugId ==="
Write-Host "Workflow id: $workflowId"
Write-Host "Export a subir: $ExportPath"
Write-Host "Escenarios del bug: $($BugScenarioKeys -join ', ')"
Write-Host "Escenarios de regresion (deben seguir pasando): $($RegressionScenarioKeys -join ', ')"
Write-Host ""

$backupPath = $null
if (-not $SkipBackup) {
  $backupDir = "workflows/backups"
  if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $backupPath = Join-Path $backupDir "$workflowId`_pre_$BugId`_$stamp.json"

  Write-Host "Paso 1/5: respaldando workflow en vivo..."
  $live = Invoke-RestMethod -Method Get -Uri "$n8nBaseUrl/api/v1/workflows/$workflowId" -Headers $headers
  ($live | ConvertTo-Json -Depth 100) | Set-Content -Encoding UTF8 -Path $backupPath
  Write-Host "OK: backup guardado en $backupPath"
} else {
  Write-Host "Paso 1/5: backup omitido (-SkipBackup)."
}

Write-Host ""
Write-Host "Paso 2/5: subiendo export con el fix aplicado..."
& powershell -ExecutionPolicy Bypass -File "scripts/n8n_update_workflow_from_export.ps1" -ExportPath $ExportPath | Out-Host
if ($LASTEXITCODE -ne 0) {
  throw "Fallo al subir el export. No se corrieron escenarios. Revisa el error arriba antes de reintentar."
}

$thresholdUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")
$allKeys = @($BugScenarioKeys) + @($RegressionScenarioKeys)

Write-Host ""
Write-Host "Paso 3/5: corriendo $($allKeys.Count) escenarios QA (bug + regresion)..."
foreach ($key in $allKeys) {
  Write-Host "  -> ejecutando $key"
  & powershell -ExecutionPolicy Bypass -File "scripts/qa_run_webhook.ps1" -ScenarioKey $key -BatchWaitSeconds 0 | Out-Null
  Start-Sleep -Seconds $PerScenarioWaitSeconds
}

Write-Host ""
Write-Host "Paso 4/5: esperando veredicto de OpenAI (llm_passed) para cada escenario..."

$keysSqlList = ($allKeys | ForEach-Object { "'$_'" }) -join ","
$pollSql = "SELECT count(DISTINCT scenario_id) FROM public.qa_test_results WHERE scenario_id IN ($keysSqlList) AND created_at > '$thresholdUtc' AND llm_passed IS NOT NULL;"

$elapsed = 0
$pollIntervalSec = 8
$doneCount = 0
while ($elapsed -lt $JudgeTimeoutSec) {
  $doneCount = (& psql $dbUrl -t -A -c $pollSql).Trim()
  Write-Host "  veredictos listos: $doneCount / $($allKeys.Count) (elapsed ${elapsed}s)"
  if ([int]$doneCount -ge $allKeys.Count) { break }
  Start-Sleep -Seconds $pollIntervalSec
  $elapsed += $pollIntervalSec
}

if ([int]$doneCount -lt $allKeys.Count) {
  Write-Host "ADVERTENCIA: no todos los veredictos llegaron dentro de $JudgeTimeoutSec s. Se evalua con lo que haya."
}

$resultsSql = @"
SELECT scenario_id, llm_passed, coalesce(llm_notes, '') AS llm_notes
FROM public.qa_test_results
WHERE scenario_id IN ($keysSqlList)
  AND created_at > '$thresholdUtc'
ORDER BY scenario_id;
"@

$rawResults = & psql $dbUrl -t -A -F "|" -c $resultsSql

$results = @{}
foreach ($line in $rawResults) {
  if (-not $line) { continue }
  $parts = $line -split '\|', 3
  if ($parts.Count -lt 2) { continue }
  $sid = $parts[0].Trim()
  $passedRaw = $parts[1].Trim()
  $notes = if ($parts.Count -ge 3) { $parts[2] } else { "" }
  $results[$sid] = @{ passed = $passedRaw; notes = $notes }
}

Write-Host ""
Write-Host "Paso 5/5: evaluando resultados..."
Write-Host ""

$regressionFailures = @()
foreach ($key in $RegressionScenarioKeys) {
  $r = $results[$key]
  $passed = $r -and ($r.passed -eq "t")
  $mark = if ($passed) { "OK " } else { "FAIL" }
  Write-Host "[$mark] (regresion) $key"
  if (-not $passed) {
    $regressionFailures += $key
    if ($r) { Write-Host "       notas: $($r.notes)" }
  }
}

Write-Host ""
$bugStillFailing = @()
foreach ($key in $BugScenarioKeys) {
  $r = $results[$key]
  $passed = $r -and ($r.passed -eq "t")
  $mark = if ($passed) { "OK " } else { "FAIL" }
  Write-Host "[$mark] (bug $BugId) $key"
  if ($r) { Write-Host "       notas: $($r.notes)" }
  if (-not $passed) { $bugStillFailing += $key }
}

Write-Host ""

if ($regressionFailures.Count -gt 0) {
  Write-Host "REGRESION DETECTADA en: $($regressionFailures -join ', ')"
  if (-not $SkipRollbackOnRegression -and $backupPath) {
    Write-Host "Ejecutando rollback automatico al backup: $backupPath"
    & powershell -ExecutionPolicy Bypass -File "scripts/n8n_update_workflow_from_export.ps1" -ExportPath $backupPath | Out-Host
    if ($LASTEXITCODE -eq 0) {
      Write-Host "OK: rollback aplicado. El workflow en vivo quedo como estaba antes de este fix."
    } else {
      Write-Host "ERROR: el rollback automatico fallo. Revisa manualmente con el backup: $backupPath"
    }
  } else {
    Write-Host "Rollback automatico omitido (-SkipRollbackOnRegression o sin backup). Backup disponible en: $backupPath"
  }
  exit 1
}

if ($bugStillFailing.Count -gt 0) {
  Write-Host "Sin regresiones, pero el bug $BugId sigue sin resolverse en: $($bugStillFailing -join ', ')"
  Write-Host "El fix queda desplegado (no rompio nada existente) pero necesita otra iteracion."
  exit 2
}

Write-Host "EXITO: $BugId resuelto y sin regresiones en los 20 BASE."
exit 0
