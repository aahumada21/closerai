param(
  [string]$SqlFolder = "QA/sql",
  [string]$SqlPattern = "qa*.sql",
  [int]$MaxScenarios = 10,
  [string]$TempPrefix = "56990",
  [string]$OutputFolder = "QA/results",
  [switch]$SkipUpload,
  [switch]$NoDisableAfterRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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

function Require-Tool([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$Name' en PATH."
  }
}

function Get-ScenarioKeyFromSql([string]$Path) {
  $content = Get-Content -Raw -Path $Path
  $m = [regex]::Match($content, "'(\d{9,})'")
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

Import-DotEnv ".env"
Require-Tool "psql"
$dbUrl = Require-Env "SUPABASE_DB_URL"
$webhookUrl = Require-Env "N8N_QA_RUNNER_WEBHOOK_URL"

if (-not (Test-Path $SqlFolder)) { throw "No existe carpeta: $SqlFolder" }
if (-not (Test-Path $OutputFolder)) { New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null }

$sqlFiles = @(Get-ChildItem -Path $SqlFolder -File -Filter $SqlPattern | Sort-Object LastWriteTime -Descending | Select-Object -First $MaxScenarios)
if ($sqlFiles.Count -eq 0) { throw "No se encontraron SQL en $SqlFolder con patrón $SqlPattern" }

$scenarioKeys = @()
foreach ($file in $sqlFiles) {
  $scenarioKey = Get-ScenarioKeyFromSql -Path $file.FullName
  if ($scenarioKey) { $scenarioKeys += $scenarioKey }
}
$scenarioKeys = @($scenarioKeys | Select-Object -Unique)

if ($scenarioKeys.Count -eq 0) { throw "No pude detectar scenario_key en los SQL seleccionados." }

Write-Host "QA_LARGE: escenarios detectados ($($scenarioKeys.Count)): $($scenarioKeys -join ', ')"

if (-not $SkipUpload) {
  foreach ($file in $sqlFiles) {
    Write-Host "Subiendo: $($file.FullName)"
    $uploadOutput = & psql $dbUrl -v ON_ERROR_STOP=1 -f $file.FullName 2>&1
    $uploadText = ($uploadOutput | Out-String)
    if ($LASTEXITCODE -ne 0) {
      if ($uploadText -match "duplicate key value violates unique constraint") {
        Write-Host "Aviso: escenario ya existe, continúo ($($file.Name))."
      } else {
        throw "Falló carga SQL: $($file.Name)`n$uploadText"
      }
    } else {
      $uploadOutput | Out-Host
    }
  }
}

$runBody = @{
  use_temp = $true
  temp_prefix = $TempPrefix
} | ConvertTo-Json -Depth 5

Write-Host "Ejecutando una sola corrida webhook para lote QA..."
$resp = Invoke-RestMethod -Method Post -Uri $webhookUrl -ContentType "application/json" -Body $runBody -TimeoutSec 600
$runRespPath = Join-Path $OutputFolder ("qa_large_webhook_response_{0}.json" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
$resp | ConvertTo-Json -Depth 12 | Out-File -FilePath $runRespPath -Encoding utf8
Write-Host "Respuesta webhook guardada en: $runRespPath"

Start-Sleep -Seconds 8

$keysSql = ($scenarioKeys | ForEach-Object { "'$_'" }) -join ","
$summarySql = @"
WITH latest AS (
  SELECT
    scenario_id,
    max(created_at) AS max_created_at
  FROM public.qa_test_results
  WHERE scenario_id IN ($keysSql)
  GROUP BY scenario_id
),
runs AS (
  SELECT DISTINCT ON (r.scenario_id)
    r.scenario_id,
    r.run_id,
    r.created_at
  FROM public.qa_test_results r
  JOIN latest l
    ON l.scenario_id = r.scenario_id
   AND r.created_at <= l.max_created_at
  WHERE r.scenario_id IN ($keysSql)
  ORDER BY r.scenario_id, r.created_at DESC
),
agg AS (
  SELECT
    rr.scenario_id,
    rr.run_id,
    count(*) AS steps_total,
    count(*) FILTER (WHERE r.passed) AS steps_passed,
    bool_and(
      COALESCE((r.audit_snapshot->>'flow_name') IS NOT NULL, false)
      AND COALESCE((r.audit_snapshot->>'idempotency_key') IS NOT NULL, false)
      AND COALESCE((r.audit_snapshot->'decision'->>'action') IS NOT NULL, false)
    ) AS audit_ok
  FROM runs rr
  JOIN public.qa_test_results r
    ON r.run_id = rr.run_id
  GROUP BY rr.scenario_id, rr.run_id
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'executed_at', now(),
    'scenarios', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'scenario_id', scenario_id,
          'run_id', run_id,
          'steps_total', steps_total,
          'steps_passed', steps_passed,
          'all_passed', (steps_total = steps_passed),
          'audit_ok', audit_ok
        )
        ORDER BY scenario_id
      )
      FROM agg
    )
  )
);
"@

$summary = & psql $dbUrl -t -A -v ON_ERROR_STOP=1 -c $summarySql
if ($LASTEXITCODE -ne 0) { throw "Falló lectura de resultados QA_LARGE" }

$summaryPath = Join-Path $OutputFolder ("qa_large_summary_{0}.json" -f (Get-Date -Format "yyyyMMdd_HHmmss"))
$summary | Out-File -FilePath $summaryPath -Encoding utf8
Write-Host "Resumen guardado en: $summaryPath"
$summary | Write-Host

if (-not $NoDisableAfterRun) {
  $disableSql = @"
UPDATE public.qa_test_scenarios_temp
SET enabled = false,
    updated_at = now()
WHERE scenario_key IN ($keysSql);
"@
  & psql $dbUrl -v ON_ERROR_STOP=1 -c $disableSql | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "No se pudo deshabilitar lote QA_LARGE" }
  Write-Host "OK: escenarios del lote deshabilitados."
}
