param(
  [Parameter(Mandatory = $true)]
  [string]$ScenarioKey,

  [string]$RunId
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

if ([string]::IsNullOrWhiteSpace($RunId)) {
  $sqlRun = @"
SELECT run_id
FROM public.qa_test_results
WHERE scenario_id = '$ScenarioKey'
ORDER BY created_at DESC
LIMIT 1;
"@
  $RunId = (& psql $dbUrl -t -A -v ON_ERROR_STOP=1 -c $sqlRun).Trim()
}

if ([string]::IsNullOrWhiteSpace($RunId)) {
  throw "No se encontró run_id para scenario_key=$ScenarioKey"
}

$sql = @"
SELECT jsonb_pretty(
  jsonb_build_object(
    'run_id', '$RunId',
    'scenario_id', '$ScenarioKey',
    'steps', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'step_index', step_index,
          'passed', passed,
          'text_sent', text_sent,
          'bot_response', bot_response,
          'errors', errors,
          'flow_name', audit_snapshot->>'flow_name',
          'decision_action', audit_snapshot->'decision'->>'action',
          'idempotency_key', audit_snapshot->>'idempotency_key',
          'requirements_ok', audit_snapshot->'meta'->'validation'->>'requirements_ok',
          'execution_success', audit_snapshot->'meta'->'execution_result'->>'success'
        )
        ORDER BY step_index
      )
      FROM public.qa_test_results
      WHERE run_id = '$RunId'
    )
  )
);
"@

& psql $dbUrl -t -A -v ON_ERROR_STOP=1 -c $sql
