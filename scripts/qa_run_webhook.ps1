param(
  [string]$ScenarioKey,

  [switch]$BatchMode,

  [int]$BatchWaitSeconds = 20,

  [string]$OutputPath,

  [int]$TimeoutSec = 300,

  [string]$RunId,

  [switch]$SaveJsonResponse,

  [switch]$NoDisableAfterRun,

  [switch]$DisableAfterRun,

  [switch]$DisableByPrefix,

  [switch]$DisableByRunId,

  [switch]$VerboseMode,

  [ValidateSet("temp", "stable")]
  [string]$Source = "temp",

  [switch]$UseTemp = $true,

  [string]$TempPrefix = "56990"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($NoDisableAfterRun) {
  $DisableAfterRun = $false
}

if (-not $ScenarioKey -and -not $BatchMode) {
  throw "Debes indicar -ScenarioKey o usar -BatchMode."
}

if ($BatchMode -and $DisableAfterRun -and -not $DisableByPrefix -and -not $DisableByRunId) {
  $DisableByPrefix = $true
}

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

function Invoke-DisableScenario([string]$dbUrl, [string]$scenarioKey) {
  $sql = @"
UPDATE public.qa_test_scenarios_temp
SET enabled = false,
    updated_at = now()
WHERE scenario_key = '$scenarioKey';
"@
  & psql $dbUrl -v ON_ERROR_STOP=1 -c $sql | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "No se pudo deshabilitar scenario_key=$scenarioKey" }
}

function Invoke-DisableByPrefix([string]$dbUrl, [string]$prefix) {
  $sql = @"
UPDATE public.qa_test_scenarios_temp
SET enabled = false,
    updated_at = now()
WHERE enabled = true
  AND scenario_key LIKE '$prefix%';
"@
  & psql $dbUrl -v ON_ERROR_STOP=1 -c $sql | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "No se pudo deshabilitar por prefijo=$prefix" }
}

function Invoke-DisableByRunId([string]$dbUrl, [string]$runId) {
  $sql = @"
UPDATE public.qa_test_scenarios_temp t
SET enabled = false,
    updated_at = now()
WHERE t.enabled = true
  AND EXISTS (
    SELECT 1
    FROM public.qa_test_results r
    WHERE r.run_id = '$runId'
      AND r.scenario_id = t.scenario_key
  );
"@
  & psql $dbUrl -v ON_ERROR_STOP=1 -c $sql | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "No se pudo deshabilitar por run_id=$runId" }
}

Import-DotEnv ".env"

$webhookUrl = Require-Env "N8N_QA_RUNNER_WEBHOOK_URL"
$dbUrl = Require-Env "SUPABASE_DB_URL"

$bodyObj = @{
  use_temp = [bool]$UseTemp
  temp_prefix = $TempPrefix
}

if ($ScenarioKey) {
  $bodyObj["scenario_key"] = $ScenarioKey
}

$body = $bodyObj | ConvertTo-Json -Depth 8

if ($BatchMode) {
  Write-Host "Ejecutando QA batch por webhook (prefijo=$TempPrefix)..."
} else {
  Write-Host "Ejecutando QA por webhook para scenario_key=$ScenarioKey ..."
}

$resp = Invoke-RestMethod -Method Post -Uri $webhookUrl -ContentType "application/json" -Body $body -TimeoutSec $TimeoutSec

Write-Host "Webhook ejecutado."
if ($resp) {
  $json = $resp | ConvertTo-Json -Depth 12
  if ($SaveJsonResponse -or $OutputPath) {
    $target = if ($OutputPath) { $OutputPath } else { "QA/results/qa_webhook_response_$(Get-Date -Format 'yyyyMMdd_HHmmss').json" }
    $dir = Split-Path -Parent $target
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $json | Out-File -FilePath $target -Encoding utf8
    Write-Host "Respuesta guardada en: $target"
  } else {
    $json | Write-Host
  }
}

if ($BatchMode -and $BatchWaitSeconds -gt 0) {
  Start-Sleep -Seconds $BatchWaitSeconds
}

if ($DisableAfterRun) {
  if ($ScenarioKey) {
    Write-Host "Deshabilitando escenario ejecutado (enabled=false)..."
    Invoke-DisableScenario -dbUrl $dbUrl -scenarioKey $ScenarioKey
    Write-Host "OK: escenario deshabilitado."
  } elseif ($DisableByRunId -and $RunId) {
    Write-Host "Deshabilitando escenarios ejecutados en run_id=$RunId..."
    Invoke-DisableByRunId -dbUrl $dbUrl -runId $RunId
    Write-Host "OK: escenarios deshabilitados por run_id."
  } elseif ($DisableByPrefix) {
    Write-Host "Deshabilitando escenarios enabled por prefijo=$TempPrefix..."
    Invoke-DisableByPrefix -dbUrl $dbUrl -prefix $TempPrefix
    Write-Host "OK: escenarios deshabilitados por prefijo."
  }
}
