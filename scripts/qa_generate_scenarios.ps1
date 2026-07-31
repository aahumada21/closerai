param(
  [Parameter(Mandatory = $true)]
  [string]$JsonFile,

  [switch]$EnableAfterUpload,

  [string]$OutputSqlPath
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

function Require-Tool([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontro '$Name' en PATH."
  }
}

function Require-Env([string]$Name) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Falta variable: $Name" }
  return $v.Trim()
}

function Sql-Text([string]$Value) {
  if ([string]::IsNullOrEmpty($Value)) { return "NULL" }
  return "'" + $Value.Replace("'", "''") + "'"
}

function Get-Prop($Object, [string]$Name, $Default = $null) {
  if ($null -ne $Object.PSObject.Properties[$Name]) {
    return $Object.PSObject.Properties[$Name].Value
  }
  return $Default
}

if (-not (Test-Path $JsonFile)) { throw "No existe JsonFile: $JsonFile" }
Import-DotEnv ".env"
Require-Tool "psql"
$dbUrl = Require-Env "SUPABASE_DB_URL"

$scenarios = Get-Content -Raw $JsonFile | ConvertFrom-Json

if (-not $scenarios -or $scenarios.Count -eq 0) {
  throw "El archivo JSON no contiene escenarios (debe ser un array)."
}

Write-Host "Generando SQL para $($scenarios.Count) escenario(s) desde: $JsonFile"

$enabledValue = if ($EnableAfterUpload) { "true" } else { "false" }

$sqlParts = @()
foreach ($scenario in $scenarios) {
  if (-not $scenario.scenario_key) { throw "Un escenario no tiene scenario_key." }
  if (-not $scenario.name) { throw "El escenario $($scenario.scenario_key) no tiene name." }
  if (-not $scenario.steps) { throw "El escenario $($scenario.scenario_key) no tiene steps." }

  $key = Sql-Text $scenario.scenario_key
  $name = Sql-Text $scenario.name
  $suite = Sql-Text (Get-Prop $scenario "suite" "temp")
  $priorityValue = Get-Prop $scenario "priority" 50
  $priority = if ($priorityValue) { [int]$priorityValue } else { 50 }
  $tags = @(Get-Prop $scenario "tags" @()) | Where-Object { $_ }
  $tagsArray = if ($tags.Count -gt 0) {
    "ARRAY[" + (($tags | ForEach-Object { Sql-Text $_ }) -join ",") + "]::text[]"
  } else {
    "ARRAY[]::text[]"
  }
  # ConvertTo-Json "desenvuelve" arrays de un solo elemento (los convierte en
  # objeto suelto en vez de array de 1). Forzamos array siempre con @(...) +
  # -AsArray para que "steps" en la base quede consistente sin importar
  # cuantos pasos tenga el escenario.
  $stepsArray = @($scenario.steps)
  $stepsJson = ($stepsArray | ConvertTo-Json -Depth 10 -Compress -AsArray).Replace("'", "''")
  $expectedOutcome = Sql-Text (Get-Prop $scenario "expected_outcome" $null)
  $category = Sql-Text (Get-Prop $scenario "category" $null)

  $sqlParts += @"
INSERT INTO public.qa_test_scenarios_temp
  (scenario_key, name, suite, enabled, priority, tags, steps, expected_outcome, category)
VALUES
  ($key, $name, $suite, $enabledValue, $priority, $tagsArray, '$stepsJson'::jsonb, $expectedOutcome, $category)
ON CONFLICT (scenario_key) DO UPDATE SET
  name = EXCLUDED.name,
  suite = EXCLUDED.suite,
  priority = EXCLUDED.priority,
  tags = EXCLUDED.tags,
  steps = EXCLUDED.steps,
  expected_outcome = EXCLUDED.expected_outcome,
  category = EXCLUDED.category,
  updated_at = now();
"@
}

$sql = $sqlParts -join "`n`n"

$sqlPath = if ($OutputSqlPath) { $OutputSqlPath } else {
  Join-Path $env:TEMP "qa_generate_scenarios_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
}
Set-Content -Path $sqlPath -Value $sql -Encoding UTF8

Write-Host "SQL generado en: $sqlPath"
Write-Host "Subiendo a la base de datos..."

& psql $dbUrl -v ON_ERROR_STOP=1 -f $sqlPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "OK: $($scenarios.Count) escenario(s) cargados en qa_test_scenarios_temp (enabled=$enabledValue)."
Write-Host "Para correrlos: scripts/qa_run_webhook.ps1 -BatchMode -TempPrefix '<prefijo comun de tus scenario_key>'"
