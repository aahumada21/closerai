param(
  [Parameter(Mandatory = $true)]
  [string]$ScenariosFile,

  [int]$DefaultWaitSeconds = 14,

  [string]$OutputJsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# psql emite UTF-8; sin esto PowerShell lee mal los acentos/eñes y los checks
# de texto ("horario", "sabado") pueden fallar por bytes mal interpretados,
# no por una respuesta real distinta.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PGCLIENTENCODING = "UTF8"

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

function Sql-Scalar([string]$dbUrl, [string]$sql) {
  $raw = & psql $dbUrl -t -A -c $sql
  return ($raw | Select-Object -First 1)
}

# Harness de QA end-to-end (conversaciones reales multi-turno, multi-agente).
# NO reutiliza el runner serial 9.1/9.1.1 (splitInBatches, corta despues del
# primer paso en escenarios largos, bug conocido documentado en memoria) --
# dispara los webhooks directo, igual que las pruebas manuales de esta sesion,
# y valida por SQL contra messages/lead_state/appointments.
#
# Formato de $ScenariosFile (JSON), array de escenarios:
# [
#   {
#     "key": "detailing_golden_path_postpago",
#     "phone_number_id": "1041798619026307",
#     "phone_prefix": "e2e1",
#     "turns": [
#       { "text": "hola quiero lavado premium...", "expect_any": ["lavado premium"] },
#       { "text": "si", "expect_any": ["horarios"] }
#     ]
#   }
# ]

Import-DotEnv (Join-Path $PSScriptRoot "..\.env")

$webhookUrl = Require-Env "N8N_QA_INGRESS_WEBHOOK_URL"
$dbUrl = Require-Env "SUPABASE_DB_URL"

$scenarios = Get-Content $ScenariosFile -Raw | ConvertFrom-Json
$runId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$allResults = @()

foreach ($scenario in $scenarios) {
  $phone = "56" + $scenario.phone_prefix + $runId.ToString().Substring($runId.ToString().Length - 5)
  Write-Host ""
  Write-Host "=== Escenario: $($scenario.key) (phone=$phone) ===" -ForegroundColor Cyan

  $turnResults = @()
  $turnIndex = 0

  foreach ($turn in $scenario.turns) {
    $turnIndex++
    $waitSeconds = if ($turn.PSObject.Properties.Name -contains "wait") { $turn.wait } else { $DefaultWaitSeconds }

    $body = @{
      channel = "whatsapp"
      message_id = "e2e-$runId-$($scenario.key)-$turnIndex"
      timestamp = (Get-Date).ToUniversalTime().ToString("o")
      text = $turn.text
      message_type = "text"
      attachments = @()
      source_metadata = @{ test_mode = $true; provider = "meta_whatsapp_cloud_api"; phone_number_id = $scenario.phone_number_id }
      routing = $null; organization = $null; agent = $null; channel_config = $null; whatsapp_number = $null
      lead = @{ name = "E2E $($scenario.key)"; phone = $phone; external_id = $phone; channel = "whatsapp" }
    } | ConvertTo-Json -Depth 6

    try {
      Invoke-RestMethod -Method Post -Uri $webhookUrl -ContentType "application/json" -Body $body -TimeoutSec 30 | Out-Null
    } catch {
      Write-Host "  [turno $turnIndex] ERROR al enviar: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds $waitSeconds

    $sql = "SELECT m.content FROM messages m JOIN leads l ON l.id = m.lead_id WHERE l.phone = '$phone' AND l.agent_id IS NOT NULL AND m.direction = 'outbound' ORDER BY m.created_at DESC LIMIT 1;"
    $lastMessage = Sql-Scalar $dbUrl $sql

    $lastMessageSafe = if ($lastMessage) { $lastMessage } else { "" }

    $expectAny = @(if ($turn.PSObject.Properties.Name -contains "expect_any") { $turn.expect_any } else { @() })
    $pass = $true
    $failReason = ""
    if ($expectAny.Count -gt 0) {
      $lastMessageLower = $lastMessageSafe.ToLower()
      $matched = $false
      foreach ($needle in $expectAny) {
        if ($lastMessageLower.Contains($needle.ToLower())) { $matched = $true; break }
      }
      if (-not $matched) {
        $pass = $false
        $failReason = "esperaba alguno de [$($expectAny -join ', ')] en la respuesta"
      }
    }

    $status = if ($pass) { "PASS" } else { "FAIL" }
    $color = if ($pass) { "Green" } else { "Red" }
    $preview = $lastMessageSafe.Substring(0, [Math]::Min(80, $lastMessageSafe.Length))
    Write-Host "  [turno $turnIndex] $status - '$($turn.text)' -> $preview" -ForegroundColor $color
    if (-not $pass) { Write-Host "    Motivo: $failReason" -ForegroundColor Yellow }

    $turnResults += [PSCustomObject]@{
      Turn = $turnIndex
      Text = $turn.text
      LastMessage = $lastMessage
      Pass = $pass
      FailReason = $failReason
    }
  }

  $scenarioPass = @($turnResults | Where-Object { -not $_.Pass }).Count -eq 0
  $allResults += [PSCustomObject]@{
    Scenario = $scenario.key
    Phone = $phone
    Pass = $scenarioPass
    Turns = $turnResults
  }
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
$allResults | ForEach-Object {
  $status = if ($_.Pass) { "PASS" } else { "FAIL" }
  $color = if ($_.Pass) { "Green" } else { "Red" }
  Write-Host "$status - $($_.Scenario)" -ForegroundColor $color
}

$failedScenarios = @($allResults | Where-Object { -not $_.Pass })
Write-Host ""
Write-Host "$($allResults.Count - $failedScenarios.Count)/$($allResults.Count) escenarios PASS" -ForegroundColor $(if ($failedScenarios.Count -eq 0) { "Green" } else { "Yellow" })

if ($OutputJsonPath) {
  $allResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputJsonPath -Encoding utf8
  Write-Host "Resultado guardado en: $OutputJsonPath"
}

if ($failedScenarios.Count -gt 0) { exit 1 } else { exit 0 }
