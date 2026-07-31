param(
  [string]$WorkflowExportPath = "workflows/exports/webchat/webchat_inbound_adapter.json",
  [string]$WebhookUrl,
  [string]$WidgetId = "qa-webchat-main",
  [string]$UnknownWidgetId = "qa-webchat-unknown",
  [string]$VisitorId = "qa-visitor-472",
  [string]$SessionId = "qa-session-472",
  [string]$Token,
  [switch]$SkipLive,
  [string]$OutputPath = "QA/results/qa_webchat_inbound_adapter_472.json"
)

$ErrorActionPreference = "Stop"

function Load-DotEnv {
  if (-not (Test-Path -LiteralPath ".env")) { return }
  Get-Content -LiteralPath ".env" | Where-Object {
    $_ -match '^[A-Za-z_][A-Za-z0-9_]*='
  } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
  }
}

function Resolve-WebhookUrl {
  param([string]$ExplicitUrl)

  if (-not [string]::IsNullOrWhiteSpace($ExplicitUrl)) {
    return $ExplicitUrl.TrimEnd("/")
  }

  if (-not [string]::IsNullOrWhiteSpace($env:N8N_WEBCHAT_INBOUND_WEBHOOK_URL)) {
    return $env:N8N_WEBCHAT_INBOUND_WEBHOOK_URL.TrimEnd("/")
  }

  $base = $env:N8N_API_URL
  if ([string]::IsNullOrWhiteSpace($base)) { $base = $env:N8N_BASE_URL }
  if ([string]::IsNullOrWhiteSpace($base)) {
    throw "Falta WebhookUrl o N8N_WEBCHAT_INBOUND_WEBHOOK_URL/N8N_API_URL/N8N_BASE_URL."
  }

  $base = $base.TrimEnd("/") -replace "/api/v1$", ""
  return "$base/webhook/webchat-inbound"
}

function Resolve-Token {
  param([string]$ExplicitToken)
  if (-not [string]::IsNullOrWhiteSpace($ExplicitToken)) { return $ExplicitToken }
  if (-not [string]::IsNullOrWhiteSpace($env:WEBCHAT_WIDGET_TOKEN)) { return $env:WEBCHAT_WIDGET_TOKEN }
  if (-not [string]::IsNullOrWhiteSpace($env:WEBCHAT_SHARED_SECRET)) { return $env:WEBCHAT_SHARED_SECRET }
  return $null
}

function Invoke-SqlRows {
  param([string]$Sql)
  $tmp = New-TemporaryFile
  try {
    psql "$env:SUPABASE_DB_URL" -X -A -t -F "`t" -c $Sql | Out-File -Encoding utf8 $tmp
    return @(Get-Content -LiteralPath $tmp | Where-Object { $_.Trim() -ne "" })
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

function Escape-Sql {
  param([string]$Value)
  return ($Value -replace "'", "''")
}

function Send-WebchatPayload {
  param(
    [string]$Url,
    [string]$HeaderToken,
    [hashtable]$Payload
  )

  $body = $Payload | ConvertTo-Json -Depth 20
  try {
    $response = Invoke-WebRequest `
      -Method Post `
      -Uri $Url `
      -ContentType "application/json" `
      -Headers @{ "X-Webchat-Token" = $HeaderToken } `
      -Body $body `
      -UseBasicParsing `
      -TimeoutSec 60

    return @{
      ok = ([int]$response.StatusCode -eq 200)
      status_code = [int]$response.StatusCode
      error = $null
    }
  } catch {
    return @{
      ok = $false
      status_code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { $null }
      error = $_.Exception.Message
    }
  }
}

Load-DotEnv

$errors = @()
$staticChecks = [ordered]@{}

if (-not (Test-Path -LiteralPath $WorkflowExportPath)) {
  throw "No existe workflow export: $WorkflowExportPath"
}

$workflow = Get-Content -Raw -Encoding UTF8 -LiteralPath $WorkflowExportPath | ConvertFrom-Json
$nodes = @($workflow.nodes)
$normalizeNode = $nodes | Where-Object { $_.name -eq "CODE validate_and_normalize_webchat" } | Select-Object -First 1
$resolverNode = $nodes | Where-Object { $_.name -eq "Call '2.1 channel_config_resolver'" } | Select-Object -First 1
$leadLoaderNode = $nodes | Where-Object { $_.name -eq "Call '2 lead_loader'" } | Select-Object -First 1
$rejectLogNode = $nodes | Where-Object { $_.name -eq "DB log_webchat_rejected" } | Select-Object -First 1

$normalizeCode = if ($normalizeNode) { [string]$normalizeNode.parameters.jsCode } else { "" }

$staticChecks["has_normalize_node"] = $null -ne $normalizeNode
$staticChecks["uses_webchat_channel"] = $normalizeCode.Contains("channel: 'webchat'")
$staticChecks["uses_webchat_provider"] = $normalizeCode.Contains("provider: 'webchat_widget'")
$staticChecks["uses_external_channel_id_widget"] = $normalizeCode.Contains("external_channel_id") -and $normalizeCode.Contains("widgetId")
$staticChecks["generates_web_lead_id"] = $normalizeCode.Contains("'web_' + leadKey")
$staticChecks["requires_token"] = $normalizeCode.Contains("WEBCHAT_WIDGET_TOKEN") -and $normalizeCode.Contains("invalid_webchat_token")
$staticChecks["calls_channel_resolver"] = $null -ne $resolverNode
$staticChecks["calls_lead_loader"] = $null -ne $leadLoaderNode
$staticChecks["logs_rejected_payload"] = $null -ne $rejectLogNode

foreach ($entry in $staticChecks.GetEnumerator()) {
  if (-not $entry.Value) {
    $errors += "static check failed: $($entry.Key)"
  }
}

$live = [ordered]@{
  skipped = [bool]$SkipLive
  webhook_url = $null
  valid_payload = $null
  invalid_token_payload = $null
  unknown_widget_payload = $null
  db_checks = @{}
}

if (-not $SkipLive) {
  if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
    $errors += "live check failed: missing SUPABASE_DB_URL"
  } else {
    $resolvedToken = Resolve-Token -ExplicitToken $Token
    if ([string]::IsNullOrWhiteSpace($resolvedToken)) {
      $errors += "live check failed: missing Token/WEBCHAT_WIDGET_TOKEN/WEBCHAT_SHARED_SECRET"
    } else {
      $resolvedWebhookUrl = Resolve-WebhookUrl -ExplicitUrl $WebhookUrl
      $live.webhook_url = $resolvedWebhookUrl

      $orgAgentSql = @"
select organization_id::text, agent_id::text
from public.agent_channels
where channel='whatsapp'
  and provider='meta_whatsapp_cloud_api'
  and is_active=true
order by updated_at desc nulls last, created_at desc nulls last
limit 1;
"@
      $orgAgentRows = Invoke-SqlRows -Sql $orgAgentSql
      if ($orgAgentRows.Count -eq 0) {
        $errors += "live check failed: no active whatsapp agent_channel to reuse org/agent"
      } else {
        $parts = $orgAgentRows[0] -split "`t", 2
        $organizationId = $parts[0]
        $agentId = $parts[1]
        $widgetSql = @"
insert into public.agent_channels (
  organization_id,
  agent_id,
  channel,
  provider,
  external_channel_id,
  display_name,
  is_active,
  config
)
values (
  '$organizationId'::uuid,
  '$agentId'::uuid,
  'webchat',
  'webchat_widget',
  '$(Escape-Sql $WidgetId)',
  'QA Webchat Main',
  true,
  '{"environment":"production","inbound_enabled":true,"outbound_enabled":true,"display_name":"QA Webchat Main","default_language":"es-CL","rate_limit":{"messages_per_minute":60},"fallback_policy":{"on_error":"handoff_or_retry"}}'::jsonb
)
on conflict (provider, external_channel_id)
do update set
  organization_id = excluded.organization_id,
  agent_id = excluded.agent_id,
  channel = excluded.channel,
  display_name = excluded.display_name,
  is_active = true,
  config = excluded.config,
  updated_at = now();
"@
        [void](Invoke-SqlRows -Sql $widgetSql)

        $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $validMessageId = "web-qa-472-valid-$nowMs"
        $invalidMessageId = "web-qa-472-invalid-$nowMs"
        $unknownMessageId = "web-qa-472-unknown-$nowMs"

        $validPayload = @{
          widget_id = $WidgetId
          visitor_id = $VisitorId
          session_id = $SessionId
          message_id = $validMessageId
          name = "QA Webchat"
          email = "qa.webchat@example.com"
          phone = "+56900000472"
          text = "Hola, quiero cotizar desde el chat web"
          page_url = "https://qa.local/webchat"
          utm = @{ source = "qa"; campaign = "webchat_inbound_adapter" }
        }
        $invalidTokenPayload = $validPayload.Clone()
        $invalidTokenPayload.message_id = $invalidMessageId
        $invalidTokenPayload.visitor_id = "$VisitorId-invalid"
        $unknownWidgetPayload = $validPayload.Clone()
        $unknownWidgetPayload.message_id = $unknownMessageId
        $unknownWidgetPayload.widget_id = $UnknownWidgetId
        $unknownWidgetPayload.visitor_id = "$VisitorId-unknown"

        $live.valid_payload = Send-WebchatPayload -Url $resolvedWebhookUrl -HeaderToken $resolvedToken -Payload $validPayload
        $live.invalid_token_payload = Send-WebchatPayload -Url $resolvedWebhookUrl -HeaderToken "bad-token-qa" -Payload $invalidTokenPayload
        $live.unknown_widget_payload = Send-WebchatPayload -Url $resolvedWebhookUrl -HeaderToken $resolvedToken -Payload $unknownWidgetPayload

        Start-Sleep -Seconds 8

        $validResolverKey = "channel_config__webchat_widget__${WidgetId}__${validMessageId}"
        $invalidKey = "web_msg__${WidgetId}__${invalidMessageId}"
        $unknownResolverKey = "channel_config__webchat_widget__${UnknownWidgetId}__${unknownMessageId}"

        $validRows = Invoke-SqlRows -Sql "select event_type, normalized_ok, coalesce(error,''), coalesce(agent_id::text,''), coalesce(organization_id::text,'') from public.channel_event_logs where idempotency_key='$(Escape-Sql $validResolverKey)' order by event_received_at desc limit 1;"
        $invalidRows = Invoke-SqlRows -Sql "select event_type, normalized_ok, coalesce(error,'') from public.channel_event_logs where idempotency_key='$(Escape-Sql $invalidKey)' order by event_received_at desc limit 1;"
        $unknownRows = Invoke-SqlRows -Sql "select event_type, normalized_ok, coalesce(error,'') from public.channel_event_logs where idempotency_key='$(Escape-Sql $unknownResolverKey)' order by event_received_at desc limit 1;"
        $leadRows = Invoke-SqlRows -Sql "select id::text, channel, external_id, coalesce(agent_id::text,''), coalesce(organization_id::text,'') from public.leads where channel='webchat' and external_id='web_$(Escape-Sql $VisitorId)' order by updated_at desc limit 1;"

        $live.db_checks = [ordered]@{
          valid_resolver_log = $validRows
          invalid_token_log = $invalidRows
          unknown_widget_log = $unknownRows
          lead_row = $leadRows
        }

        if (-not $live.valid_payload.ok) {
          $errors += "live check failed: valid payload webhook did not return 200"
        }
        if (-not $live.invalid_token_payload.ok) {
          $errors += "live check failed: invalid token payload webhook did not return 200/onReceived"
        }
        if (-not $live.unknown_widget_payload.ok) {
          $errors += "live check failed: unknown widget payload webhook did not return 200/onReceived"
        }
        if ($validRows.Count -eq 0 -or $validRows[0] -notmatch "^channel_config_resolved`t(t|true)") {
          $errors += "live check failed: valid payload did not resolve channel"
        }
        if ($invalidRows.Count -eq 0 -or $invalidRows[0] -notmatch "^webchat_rejected`t(f|false)`tinvalid_webchat_token") {
          $errors += "live check failed: invalid token was not audited as invalid_webchat_token"
        }
        if ($unknownRows.Count -eq 0 -or $unknownRows[0] -notmatch "^channel_config_discarded`t(f|false)`tagent_channel_not_found") {
          $errors += "live check failed: unknown widget was not discarded as agent_channel_not_found"
        }
        if ($leadRows.Count -eq 0) {
          $errors += "live check failed: valid payload did not create/update webchat lead"
        }
      }
    }
  }
}

$passed = $errors.Count -eq 0

$result = [ordered]@{
  scenario_key = "569900472"
  name = "QA472: webchat_inbound_adapter valida token, normaliza, resuelve canal y carga lead"
  passed = $passed
  checked_at = (Get-Date).ToUniversalTime().ToString("o")
  workflow_export = $WorkflowExportPath
  widget_id = $WidgetId
  unknown_widget_id = $UnknownWidgetId
  static_checks = $staticChecks
  live = $live
  errors = $errors
}

$directory = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($directory)) {
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

$result | ConvertTo-Json -Depth 30 | Out-File -Encoding utf8 $OutputPath

if ($passed) {
  Write-Host "OK: QA472 passed. Result: $OutputPath"
} else {
  Write-Host "FAIL: QA472 failed. Result: $OutputPath"
  exit 1
}
