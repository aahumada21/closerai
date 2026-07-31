param(
  [string]$ScenarioKey,
  [string]$FromScenarioKey,
  [string]$ToScenarioKey,
  [string]$Prefix,
  [switch]$OnlyEnabled = $true
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

Import-DotEnv ".env"
$dbUrl = Require-Env "SUPABASE_DB_URL"

if (-not $ScenarioKey -and -not $Prefix -and -not ($FromScenarioKey -and $ToScenarioKey)) {
  throw "Indica -ScenarioKey, -Prefix o el rango -FromScenarioKey/-ToScenarioKey."
}

$conditions = @()
if ($OnlyEnabled) { $conditions += "enabled = true" }
if ($ScenarioKey) { $conditions += "scenario_key = '$ScenarioKey'" }
if ($Prefix) { $conditions += "scenario_key LIKE '$Prefix%'" }
if ($FromScenarioKey -and $ToScenarioKey) { $conditions += "scenario_key BETWEEN '$FromScenarioKey' AND '$ToScenarioKey'" }

$where = ($conditions -join " AND ")
$sql = @"
UPDATE public.qa_test_scenarios_temp
SET enabled = false,
    updated_at = now()
WHERE $where;
"@

Write-Host "Desactivando escenarios con condición: $where"
& psql $dbUrl -v ON_ERROR_STOP=1 -c $sql | Out-Host
if ($LASTEXITCODE -ne 0) { throw "Falló desactivación." }
Write-Host "OK: escenarios desactivados."
