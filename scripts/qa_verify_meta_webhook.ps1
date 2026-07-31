param(
  [string]$WebhookUrl,
  [string]$VerifyToken,
  [string]$Challenge = "qa_meta_challenge_569900459",
  [string]$OutputPath = "QA/results/qa_prd_phaseK_459_webhook_meta_verification.json"
)

$ErrorActionPreference = "Stop"

function Load-DotEnv {
  param([string]$Path = ".env")

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | Where-Object {
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
  if ([string]::IsNullOrWhiteSpace($base)) {
    $base = $env:N8N_BASE_URL
  }

  if ([string]::IsNullOrWhiteSpace($base)) {
    throw "Falta WebhookUrl o variable N8N_META_WEBHOOK_URL/N8N_WEBHOOK_META_URL/N8N_API_URL/N8N_BASE_URL."
  }

  $base = $base.TrimEnd("/")
  $base = $base -replace "/api/v1$", ""
  return "$base/webhook/whatsapp-meta"
}

Load-DotEnv

$resolvedUrl = Resolve-WebhookUrl -ExplicitUrl $WebhookUrl
$resolvedToken = if (-not [string]::IsNullOrWhiteSpace($VerifyToken)) {
  $VerifyToken
} else {
  $env:META_VERIFY_TOKEN
}

if ([string]::IsNullOrWhiteSpace($resolvedToken)) {
  throw "Falta VerifyToken o variable META_VERIFY_TOKEN."
}

$uriBuilder = [System.UriBuilder]::new($resolvedUrl)
$queryParts = @(
  "hub.mode=$([uri]::EscapeDataString('subscribe'))",
  "hub.verify_token=$([uri]::EscapeDataString($resolvedToken))",
  "hub.challenge=$([uri]::EscapeDataString($Challenge))"
)
$uriBuilder.Query = $queryParts -join "&"
$uri = $uriBuilder.Uri.AbsoluteUri

$startedAt = (Get-Date).ToUniversalTime().ToString("o")
$statusCode = $null
$body = $null
$errorMessage = $null

try {
  $response = Invoke-WebRequest -Method Get -Uri $uri -UseBasicParsing -TimeoutSec 60
  $statusCode = [int]$response.StatusCode
  $body = [string]$response.Content
} catch {
  $errorMessage = $_.Exception.Message
  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
    try {
      $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
    } catch {
      $body = $null
    }
  }
}

$passed = ($statusCode -eq 200 -and $body -eq $Challenge)

$result = [ordered]@{
  scenario_key = "569900459"
  name = "PRD QA459: webhook_meta_verification responde hub.challenge correcto"
  passed = $passed
  checked_at = (Get-Date).ToUniversalTime().ToString("o")
  request = @{
    method = "GET"
    url = $resolvedUrl
    mode = "subscribe"
    challenge = $Challenge
  }
  response = @{
    status_code = $statusCode
    body = $body
  }
  errors = @()
}

if (-not $passed) {
  if ($statusCode -ne 200) {
    $result.errors += "expected status 200, received $statusCode"
  }
  if ($body -ne $Challenge) {
    $result.errors += "expected plain challenge body '$Challenge', received '$body'"
  }
  if ($errorMessage) {
    $result.errors += $errorMessage
  }
}

$directory = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($directory)) {
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

$result | ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 $OutputPath

if ($passed) {
  Write-Host "OK: webhook Meta verification passed. Result: $OutputPath"
} else {
  Write-Host "FAIL: webhook Meta verification failed. Result: $OutputPath"
  exit 1
}
