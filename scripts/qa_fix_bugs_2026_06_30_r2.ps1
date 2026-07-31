param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("BUG-J","BUG-K","BUG-L","BUG-M","ALL")]
  [string]$Bug,

  [string]$ExportPath = "workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json",

  [switch]$SkipRollbackOnRegression
)

# Arnes de conveniencia para arreglar los bugs confirmados con leads limpios
# en la re-corrida del 2026-06-30 (Ronda 2).
#
# Uso:
#   scripts/qa_fix_bugs_2026_06_30_r2.ps1 -Bug "BUG-J"
#   scripts/qa_fix_bugs_2026_06_30_r2.ps1 -Bug "ALL"
#
# Antes de correr: aplicar el fix al archivo de export del workflow,
# luego llamar este script.

$REGRESSION_BASE = @(
  "569900500","569900502","569900503","569900504","569900505",
  "569900506","569900507","569900509","569900513","569900515",
  "569900516","569900518","569900519"
)

$BUG_MAP = @{
  "BUG-J" = @{
    scenarios   = @("569900523")
    export      = $ExportPath
    description = "Circuit breaker del loop de direccion se activa demasiado tarde"
  }
  "BUG-K" = @{
    scenarios   = @("569900533")
    export      = $ExportPath
    description = "Mensaje largo con multiples preguntas — bot responde solo la primera"
  }
  "BUG-L" = @{
    scenarios   = @("569900510")
    export      = $ExportPath
    description = "Inconsistencia de fecha/anio en el mensaje de confirmacion final"
  }
  "BUG-M" = @{
    scenarios   = @("569900537","569900539")
    export      = $ExportPath
    description = "Cancel+rebook / cancel durante confirmacion (race condition)"
  }
}

function Reset-ScenarioLead {
  param([string]$ScenarioKey)

  $dbUrl = [Environment]::GetEnvironmentVariable("SUPABASE_DB_URL")
  if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    Get-Content ".env" | ForEach-Object {
      if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
      $p = $_ -split '=',2
      [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
    }
    $dbUrl = [Environment]::GetEnvironmentVariable("SUPABASE_DB_URL")
  }

  $leadId = & psql $dbUrl -t -A -c "SELECT id FROM leads WHERE phone='$ScenarioKey' ORDER BY created_at DESC LIMIT 1;"
  if ([string]::IsNullOrWhiteSpace($leadId)) {
    Write-Host "  (sin lead para $ScenarioKey — se saltea reset)"
    return
  }

  $sql = "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]', booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$($leadId.Trim())';"
  & psql $dbUrl -c $sql | Out-Null
  Write-Host "  lead reseteado: $ScenarioKey ($($leadId.Trim()))"
}

function Run-BugFix {
  param([string]$BugId, [hashtable]$Config)

  Write-Host ""
  Write-Host "=========================================="
  Write-Host "Arreglando $BugId : $($Config.description)"
  Write-Host "Escenarios: $($Config.scenarios -join ', ')"
  Write-Host "=========================================="

  Write-Host "Reseteando leads de escenarios del bug..."
  foreach ($key in $Config.scenarios) {
    Reset-ScenarioLead -ScenarioKey $key
  }

  $harnessParams = @{
    ExportPath             = $Config.export
    BugScenarioKeys        = [string[]]$Config.scenarios
    RegressionScenarioKeys = [string[]]$REGRESSION_BASE
    BugId                  = $BugId
    JudgeTimeoutSec        = 300
  }

  if ($SkipRollbackOnRegression) {
    $harnessParams["SkipRollbackOnRegression"] = $true
  }

  & "scripts/qa_fix_harness.ps1" @harnessParams
  return $LASTEXITCODE
}

Get-Content ".env" | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=',2
  [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
}

$exitCode = 0

if ($Bug -eq "ALL") {
  foreach ($bugId in @("BUG-J","BUG-K","BUG-L","BUG-M")) {
    $result = Run-BugFix -BugId $bugId -Config $BUG_MAP[$bugId]
    if ($result -eq 1) {
      Write-Host "REGRESION en $bugId — deteniendo. Revisar antes de continuar."
      exit 1
    }
    if ($result -eq 2) {
      Write-Host "ADVERTENCIA: $bugId aun no resuelto. Continuando..."
      $exitCode = 2
    }
  }
} else {
  $exitCode = Run-BugFix -BugId $Bug -Config $BUG_MAP[$Bug]
}

exit $exitCode
