param(
  [string]$ScenarioKey,
  [string]$FromKey = "569900380",
  [string]$ToKey = "569900389",
  [string]$RunId,
  [string]$OutputPath
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

$where = if (-not [string]::IsNullOrWhiteSpace($ScenarioKey)) {
  "scenario_id = '$ScenarioKey'"
} else {
  "scenario_id between '$FromKey' and '$ToKey'"
}

$runFilter = if (-not [string]::IsNullOrWhiteSpace($RunId)) {
  "and run_id = '$RunId'"
} else {
  ""
}

$sql = @"
WITH latest_runs AS (
  SELECT DISTINCT ON (scenario_id)
    scenario_id,
    run_id
  FROM public.qa_test_results
  WHERE $where
    $runFilter
  ORDER BY scenario_id, created_at DESC
), rows AS (
  SELECT r.*
  FROM public.qa_test_results r
  JOIN latest_runs lr
    ON lr.scenario_id = r.scenario_id
   AND lr.run_id = r.run_id
), step_rows AS (
  SELECT
    scenario_id,
    run_id,
    step_index,
    passed,
    text_sent,
    bot_response,
    errors,
    lead_id,
    audit_snapshot,
    state_snapshot,
    COALESCE(
      audit_snapshot->>'agent_id',
      audit_snapshot->'meta'->>'agent_id',
      audit_snapshot->'meta'->'tool_registry'->>'agent_id',
      state_snapshot->'current'->>'agent_id'
    ) AS agent_id,
    COALESCE(
      audit_snapshot->>'organization_id',
      audit_snapshot->'meta'->>'organization_id',
      audit_snapshot->'meta'->'tool_registry'->>'organization_id',
      state_snapshot->'current'->>'organization_id'
    ) AS organization_id,
    COALESCE(
      audit_snapshot->'decision'->>'action',
      audit_snapshot->'meta'->>'action'
    ) AS decision_action,
    COALESCE(
      audit_snapshot->>'tool_name',
      audit_snapshot->'meta'->>'tool_name',
      audit_snapshot->'meta'->'tool_registry'->>'tool_name'
    ) AS tool_name,
    (
      COALESCE(audit_snapshot->>'flow_name', '') <> ''
      AND audit_snapshot ? 'decision'
      AND COALESCE(audit_snapshot->>'idempotency_key', '') <> ''
    ) AS audit_ok,
    created_at
  FROM rows
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'from_key', '$FromKey',
    'to_key', '$ToKey',
    'scenario_key', NULLIF('$ScenarioKey', ''),
    'generated_at', now(),
    'summary', (
      SELECT jsonb_build_object(
        'scenarios', count(DISTINCT scenario_id),
        'steps', count(*),
        'passed_steps', count(*) FILTER (WHERE passed),
        'failed_steps', count(*) FILTER (WHERE NOT passed),
        'audit_ok_steps', count(*) FILTER (WHERE audit_ok),
        'agent_id_steps', count(*) FILTER (WHERE agent_id IS NOT NULL),
        'organization_id_steps', count(*) FILTER (WHERE organization_id IS NOT NULL),
        'tool_name_steps', count(*) FILTER (WHERE tool_name IS NOT NULL)
      )
      FROM step_rows
    ),
    'steps', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'passed', passed,
          'scenario_id', scenario_id,
          'run_id', run_id,
          'step_index', step_index,
          'text_sent', text_sent,
          'bot_response', bot_response,
          'errors', errors,
          'lead_id', lead_id,
          'agent_id', agent_id,
          'organization_id', organization_id,
          'decision_action', decision_action,
          'tool_name', tool_name,
          'audit_ok', audit_ok
        )
        ORDER BY scenario_id, step_index
      )
      FROM step_rows
    )
  )
);
"@

$json = & psql $dbUrl -t -A -v ON_ERROR_STOP=1 -c $sql
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
  $dir = Split-Path -Parent $OutputPath
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $json | Out-File -FilePath $OutputPath -Encoding utf8
  Write-Host "OK: resultados multiagente guardados en $OutputPath"
} else {
  $json
}


