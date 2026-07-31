param(
  [string]$WebhookUrl,
  [string]$PhoneNumberId = "1041798619026307",
  [string]$WabaId = "qa-waba-460",
  [string]$RecipientId = "56900000460",
  [string]$MessageIdPrefix = "wamid.qa_status_460",
  [string]$OutputPath = "QA/results/qa_prd_phaseL_460_whatsapp_status_handling.json"
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

  if (-not [string]::IsNullOrWhiteSpace($env:N8N_META_WEBHOOK_URL)) {
    return $env:N8N_META_WEBHOOK_URL.TrimEnd("/")
  }

  if (-not [string]::IsNullOrWhiteSpace($env:N8N_WEBHOOK_META_URL)) {
    return $env:N8N_WEBHOOK_META_URL.TrimEnd("/")
  }

  $base = $env:N8N_API_URL
  if ([string]::IsNullOrWhiteSpace($base)) { $base = $env:N8N_BASE_URL }
  if ([string]::IsNullOrWhiteSpace($base)) {
    throw "Falta WebhookUrl o variable N8N_META_WEBHOOK_URL/N8N_WEBHOOK_META_URL/N8N_API_URL/N8N_BASE_URL."
  }

  $base = $base.TrimEnd("/") -replace "/api/v1$", ""
  return "$base/webhook/whatsapp-meta"
}

Load-DotEnv

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  throw "Falta SUPABASE_DB_URL."
}

$resolvedUrl = Resolve-WebhookUrl -ExplicitUrl $WebhookUrl
$statuses = @("sent", "delivered", "read", "failed")
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$messageIds = @()
$httpResults = @()

foreach ($status in $statuses) {
  $messageId = "$MessageIdPrefix.$status.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
  $messageIds += $messageId

  $payload = @{
    object = "whatsapp_business_account"
    entry = @(
      @{
        id = $WabaId
        changes = @(
          @{
            field = "messages"
            value = @{
              messaging_product = "whatsapp"
              metadata = @{
                display_phone_number = "56900000460"
                phone_number_id = $PhoneNumberId
              }
              statuses = @(
                @{
                  id = $messageId
                  status = $status
                  timestamp = "$timestamp"
                  recipient_id = $RecipientId
                  errors = if ($status -eq "failed") {
                    @(@{ code = 131000; title = "QA simulated send failure"; message = "QA simulated send failure" })
                  } else {
                    @()
                  }
                }
              )
            }
          }
        )
      }
    )
  } | ConvertTo-Json -Depth 20

  try {
    $resp = Invoke-WebRequest -Method Post -Uri $resolvedUrl -ContentType "application/json" -Body $payload -UseBasicParsing -TimeoutSec 60
    $httpResults += @{
      status = $status
      message_id = $messageId
      status_code = [int]$resp.StatusCode
      ok = ([int]$resp.StatusCode -eq 200)
    }
  } catch {
    $httpResults += @{
      status = $status
      message_id = $messageId
      status_code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { $null }
      ok = $false
      error = $_.Exception.Message
    }
  }
}

Start-Sleep -Seconds 8

$idsSql = ($messageIds | ForEach-Object { "'" + ($_ -replace "'", "''") + "'" }) -join ","
$query = @"
select
  event_type,
  phone_number_id,
  message_id,
  normalized_event->>'status' as status,
  normalized_ok,
  error
from public.whatsapp_webhook_logs
where message_id in ($idsSql)
order by created_at asc;
"@

$tmp = New-TemporaryFile
try {
  psql "$env:SUPABASE_DB_URL" -X -A -t -F "`t" -c $query | Out-File -Encoding utf8 $tmp
  $rows = @(Get-Content -LiteralPath $tmp | Where-Object { $_.Trim() -ne "" } | ForEach-Object {
    $parts = $_ -split "`t", 6
    @{
      event_type = $parts[0]
      phone_number_id = $parts[1]
      message_id = $parts[2]
      status = $parts[3]
      normalized_ok = $parts[4]
      error = if ($parts.Count -ge 6) { $parts[5] } else { $null }
    }
  })
} finally {
  Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}

$loggedStatuses = @($rows | ForEach-Object { $_.status })
$missingStatuses = @($statuses | Where-Object { $loggedStatuses -notcontains $_ })
$badRows = @($rows | Where-Object {
  $_.event_type -ne "status" -or
  $_.phone_number_id -ne $PhoneNumberId -or
  $_.normalized_ok -ne "t"
})

$passed = (
  (@($httpResults | Where-Object { -not $_.ok }).Count -eq 0) -and
  ($missingStatuses.Count -eq 0) -and
  ($badRows.Count -eq 0)
)

$result = [ordered]@{
  scenario_key = "569900460"
  name = "PRD QA460: whatsapp_status_handling procesa sent/delivered/read/failed"
  passed = $passed
  checked_at = (Get-Date).ToUniversalTime().ToString("o")
  webhook_url = $resolvedUrl
  requested_statuses = $statuses
  http_results = $httpResults
  db_rows = $rows
  errors = @()
}

if (@($httpResults | Where-Object { -not $_.ok }).Count -gt 0) {
  $result.errors += "one or more webhook POST calls did not return 200"
}
if ($missingStatuses.Count -gt 0) {
  $result.errors += "missing logged statuses: $($missingStatuses -join ', ')"
}
if ($badRows.Count -gt 0) {
  $result.errors += "one or more logged rows are not valid status events"
}

$directory = Split-Path -Parent $OutputPath
if ($directory) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
$result | ConvertTo-Json -Depth 20 | Out-File -Encoding utf8 $OutputPath

if ($passed) {
  Write-Host "OK: QA460 passed. Result: $OutputPath"
} else {
  Write-Host "FAIL: QA460 failed. Result: $OutputPath"
  exit 1
}

