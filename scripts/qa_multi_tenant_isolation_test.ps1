param(
  [int]$WaitSeconds = 18,

  [switch]$VerboseMode
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

Import-DotEnv (Join-Path $PSScriptRoot "..\.env")

$webhookUrl = Require-Env "N8N_QA_INGRESS_WEBHOOK_URL"
$dbUrl = Require-Env "SUPABASE_DB_URL"

# Harness de aislamiento multi-tenant: dispara mensajes CONCURRENTES contra N
# agentes distintos (reusando los fixtures de agent_channels ya existentes de
# QA/sql/qa_multiagent_380_389.sql, mas el numero real de prueba
# "Detailing 01-test") y verifica que:
#   1) cada conversacion crea/usa su propia fila de lead (no se mezcla entre
#      agentes aunque el runner las procese en paralelo) -- ver fix de indice
#      unico (channel, external_id, agent_id) del 2026-07-28.
#   2) el mensaje saliente de cada agente queda marcado con el
#      phone_number_id CORRECTO de ESE agente (agent_channels.external_channel_id),
#      nunca el de otro agente -- ver fix de 6.24/6.1/6 action_executor del
#      2026-07-28 (antes, TODO el trafico salia por un numero hardcodeado).
#
# No reutiliza el runner serial 9.1/9.1.1 (splitInBatches secuencial + borra
# estado compartido por telefono) -- dispara los webhooks el mismo directo
# que ya se usa para pruebas manuales en esta sesion.

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$agents = @(
  @{ Label = "salon";       PhoneNumberId = "qa-phone-agent-salon" },
  @{ Label = "lavado";      PhoneNumberId = "qa-phone-agent-lavado" },
  @{ Label = "polarizado";  PhoneNumberId = "qa-phone-agent-polarizado" },
  @{ Label = "detailing_01_test_real"; PhoneNumberId = "1041798619026307" }
)

Write-Host "=== Harness de aislamiento multi-tenant ===" -ForegroundColor Cyan
Write-Host "Disparando $($agents.Count) conversaciones en paralelo..."

$jobs = @()
foreach ($i in 0..($agents.Count - 1)) {
  $agent = $agents[$i]
  $phone = "5699" + $timestamp.ToString().Substring($timestamp.ToString().Length - 6) + $i
  $agent.TestPhone = $phone

  $body = @{
    channel = "whatsapp"
    message_id = "isolation-test-$timestamp-$i"
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    text = "hola"
    message_type = "text"
    attachments = @()
    source_metadata = @{ test_mode = $true; provider = "meta_whatsapp_cloud_api"; phone_number_id = $agent.PhoneNumberId }
    routing = $null; organization = $null; agent = $null; channel_config = $null; whatsapp_number = $null
    lead = @{ name = "Isolation Test $($agent.Label)"; phone = $phone; external_id = $phone; channel = "whatsapp" }
  } | ConvertTo-Json -Depth 6

  $jobs += Start-Job -ScriptBlock {
    param($url, $payload)
    try {
      Invoke-RestMethod -Method Post -Uri $url -ContentType "application/json" -Body $payload -TimeoutSec 30
    } catch {
      @{ error = $_.Exception.Message }
    }
  } -ArgumentList $webhookUrl, $body
}

$jobs | Wait-Job -Timeout 30 | Out-Null
$jobs | Remove-Job -Force

Write-Host "Esperando $WaitSeconds segundos a que el pipeline procese..."
Start-Sleep -Seconds $WaitSeconds

Write-Host ""
Write-Host "=== Resultados ===" -ForegroundColor Cyan

$results = @()
foreach ($agent in $agents) {
  $phone = $agent.TestPhone
  $sql = @"
SELECT l.id, l.agent_id, al.meta->>'outbound_phone_number_id' AS outbound_phone_number_id, al.meta->>'agent_id' AS audit_agent_id
FROM leads l
LEFT JOIN LATERAL (
  SELECT meta FROM audit_logs WHERE lead_id = l.id::text ORDER BY created_at DESC LIMIT 1
) al ON true
WHERE l.external_id = '$phone' AND l.agent_id IS NOT NULL
LIMIT 1;
"@
  $raw = & psql $dbUrl -t -A -F "|" -c $sql
  $parts = ($raw | Select-Object -First 1) -split '\|'

  $leadId = $parts[0]
  $leadAgentId = $parts[1]
  $outboundPhoneNumberId = $parts[2]
  $auditAgentId = $parts[3]

  $expectedPhoneNumberId = $agent.PhoneNumberId
  $phoneMatch = ($outboundPhoneNumberId -eq $expectedPhoneNumberId)
  $agentMatch = ($leadAgentId -and $auditAgentId -and ($leadAgentId -eq $auditAgentId))

  $pass = $phoneMatch -and $agentMatch -and $leadId

  $results += [PSCustomObject]@{
    Agent = $agent.Label
    TestPhone = $phone
    LeadId = $leadId
    ExpectedPhoneNumberId = $expectedPhoneNumberId
    OutboundPhoneNumberId = $outboundPhoneNumberId
    LeadAgentId = $leadAgentId
    AuditAgentId = $auditAgentId
    Pass = $pass
  }
}

$results | Format-Table -AutoSize

# Aislamiento cruzado: ningun external_id de este run debe compartir agent_id
# con OTRO agente distinto al que se le mando (ya lo cubre la tabla de arriba,
# pero se deja explicito por si se agregan mas agentes al array).
$crossLeak = $false
foreach ($a in $results) {
  foreach ($b in $results) {
    if ($a.Agent -ne $b.Agent -and $a.LeadId -and $a.LeadId -eq $b.LeadId) {
      Write-Host "CROSS-LEAK: $($a.Agent) y $($b.Agent) comparten el mismo lead_id ($($a.LeadId))" -ForegroundColor Red
      $crossLeak = $true
    }
  }
}

$failed = @($results | Where-Object { -not $_.Pass })
if ($failed.Count -eq 0 -and -not $crossLeak) {
  Write-Host ""
  Write-Host "PASS: $($results.Count)/$($results.Count) agentes aislados correctamente (lead + numero saliente)." -ForegroundColor Green
  exit 0
} else {
  Write-Host ""
  Write-Host "FAIL: $($failed.Count)/$($results.Count) agentes con problemas de aislamiento." -ForegroundColor Red
  exit 1
}
