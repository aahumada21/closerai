param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("VERIFY-524","VERIFY-541","VERIFY-544","VERIFY-517","BUG-NEW-1","BUG-NEW-2","ALL-VERIFY","ALL-FIX")]
  [string]$Bug,

  [string]$ExportPath = "workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json"
)

# Arnes Ronda 3 — sin harnes de validacion automatica.
# Para cada bug: (1) resetea el lead, (2) corre el escenario, (3) muestra
# los mensajes y audit_logs reales para verificacion manual.
#
# Uso:
#   scripts/qa_fix_bugs_2026_06_30_r3.ps1 -Bug "VERIFY-524"
#   scripts/qa_fix_bugs_2026_06_30_r3.ps1 -Bug "BUG-NEW-1"
#   scripts/qa_fix_bugs_2026_06_30_r3.ps1 -Bug "ALL-VERIFY"   # verifica todos los stale-capture
#   scripts/qa_fix_bugs_2026_06_30_r3.ps1 -Bug "ALL-FIX"      # corre todos los bugs reales

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=',2
  [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
}

$dbUrl = $env:SUPABASE_DB_URL

$BUG_MAP = @{
  "VERIFY-524" = @{ key = "569900524"; desc = "Stale capture en loop de direccion (524)" }
  "VERIFY-541" = @{ key = "569900541"; desc = "Stale capture ante direccion incompleta (541)" }
  "VERIFY-544" = @{ key = "569900544"; desc = "Stale capture en recoleccion de direccion (544)" }
  "VERIFY-517" = @{ key = "569900517"; desc = "Stale capture con ok como direccion (517)" }
  "BUG-NEW-1"  = @{ key = "569900529"; desc = "Cambiar horario antes de confirmar (529)" }
  "BUG-NEW-2"  = @{ key = "569900538"; desc = "Reagendar con reserva activa - timing (538)" }
}

function Reset-Lead {
  param([string]$ScenarioKey)
  $leadId = (& psql $dbUrl -t -A -c "SELECT id FROM leads WHERE phone='$ScenarioKey' ORDER BY created_at DESC LIMIT 1;").Trim()
  if ([string]::IsNullOrWhiteSpace($leadId)) {
    Write-Host "  (sin lead para $ScenarioKey)"
    return $null
  }
  & psql $dbUrl -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]', booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$leadId';" | Out-Null
  Write-Host "  Lead reseteado: $ScenarioKey ($leadId)"
  return $leadId
}

function Run-Scenario {
  param([string]$ScenarioKey, [int]$WaitSeconds = 30)
  Write-Host "  Corriendo escenario $ScenarioKey..."
  & "scripts/qa_run_webhook.ps1" -ScenarioKey $ScenarioKey -BatchWaitSeconds $WaitSeconds | Out-Null
  Write-Host "  Webhook disparado. Esperando $WaitSeconds s..."
}

function Show-Results {
  param([string]$LeadId, [string]$ScenarioKey)
  Write-Host ""
  Write-Host "=== MENSAJES REALES (fuente de verdad) ==="
  & psql $dbUrl -c "SELECT direction, created_at, content FROM messages WHERE lead_id='$LeadId' ORDER BY created_at ASC;"
  Write-Host ""
  Write-Host "=== AUDIT LOGS (decisiones del bot) ==="
  & psql $dbUrl -c "SELECT latest_user_message, decision->>'action' AS action, decision->>'reason' AS reason, created_at FROM audit_logs WHERE lead_id='$LeadId' ORDER BY created_at ASC LIMIT 10;"
  Write-Host ""
  Write-Host "=== RESULTADO DEL JUEZ (puede ser stale) ==="
  & psql $dbUrl -c "SELECT llm_passed, llm_notes FROM qa_test_results WHERE scenario_id='$ScenarioKey' ORDER BY created_at DESC LIMIT 1;"
}

function Run-BugCheck {
  param([string]$BugId)
  $config = $BUG_MAP[$BugId]
  if (-not $config) { Write-Host "BUG no encontrado: $BugId"; return }

  Write-Host ""
  Write-Host "=========================================="
  Write-Host "$BugId : $($config.desc)"
  Write-Host "=========================================="

  $leadId = Reset-Lead -ScenarioKey $config.key
  if (-not $leadId) { return }

  Run-Scenario -ScenarioKey $config.key -WaitSeconds 35

  Write-Host "Esperando 20s adicionales para que el juez procese..."
  Start-Sleep -Seconds 20

  Show-Results -LeadId $leadId -ScenarioKey $config.key

  Write-Host ""
  Write-Host "INSTRUCCION: Lee los MENSAJES REALES arriba."
  Write-Host "  - Si el bot respondio correctamente segun el escenario -> PASS real (ignora qa_test_results)."
  Write-Host "  - Si el bot respondio mal -> bug real, investigar en audit_logs."
  Write-Host "=========================================="
}

switch ($Bug) {
  "ALL-VERIFY" {
    foreach ($b in @("VERIFY-524","VERIFY-541","VERIFY-544","VERIFY-517")) {
      Run-BugCheck -BugId $b
    }
  }
  "ALL-FIX" {
    foreach ($b in @("BUG-NEW-1","BUG-NEW-2")) {
      Run-BugCheck -BugId $b
    }
  }
  default {
    Run-BugCheck -BugId $Bug
  }
}
