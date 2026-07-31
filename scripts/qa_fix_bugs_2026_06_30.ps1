param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("BUG-A","BUG-B","BUG-C","BUG-D","BUG-E","BUG-F","BUG-G","BUG-H","BUG-I","ALL")]
  [string]$Bug,

  [string]$ExportPath = "workflows/exports/uncategorized/3 - 3 rules_engine__id-e88adaaf-dfed-46af-8f5f-4dd73f2cb5c5.json",

  [switch]$SkipRollbackOnRegression
)

# Arnes de conveniencia para arreglar los bugs encontrados en el batch QA 2026-06-30.
# Llama a qa_fix_harness.ps1 con los escenarios correctos pre-configurados por bug.
#
# Uso:
#   scripts/qa_fix_bugs_2026_06_30.ps1 -Bug "BUG-A"
#   scripts/qa_fix_bugs_2026_06_30.ps1 -Bug "ALL"   # Corre todos en secuencia
#
# Antes de correr: aplicar el fix al archivo de export del workflow correspondiente,
# luego llamar este script — el se encarga de subir, validar y revertir si hay
# regresiones reales.
#
# Set de regresion base (escenarios BASE que siempre deben pasar):
$REGRESSION_BASE = @(
  "569900500","569900502","569900503","569900504","569900505",
  "569900506","569900507","569900509","569900513","569900515",
  "569900516","569900518","569900519"
)

# Mapa: Bug -> escenarios del bug + export del workflow a subir (puede diferir por bug)
$BUG_MAP = @{
  "BUG-A" = @{
    scenarios   = @("569900534")
    export      = $ExportPath
    description = "Doble confirmacion de reserva no reconocida (repite instrucciones)"
  }
  "BUG-B" = @{
    scenarios   = @("569900537")
    export      = $ExportPath
    description = "Cancelar + reagendar pierde contexto tras la cancelacion"
  }
  "BUG-C" = @{
    scenarios   = @("569900538")
    export      = $ExportPath
    description = "Reagendar con horario ocupado no ofrece alternativas"
  }
  "BUG-D" = @{
    scenarios   = @("569900539")
    export      = $ExportPath
    description = "Cancelar durante confirmacion final deja al bot en loop"
  }
  "BUG-E" = @{
    scenarios   = @("569900541")
    export      = $ExportPath
    description = "Direccion incompleta (sin numero) aceptada sin validacion"
  }
  "BUG-F" = @{
    scenarios   = @("569900543")
    export      = $ExportPath
    description = "Correccion de direccion ignorada, vuelve a pedir la original"
  }
  "BUG-G" = @{
    scenarios   = @("569900551")
    export      = $ExportPath
    description = "Pregunta FAQ durante seleccion de horario no se responde"
  }
  "BUG-H" = @{
    scenarios   = @("569900550")
    export      = $ExportPath
    description = "Contexto se pierde en conversaciones largas (7+ turnos)"
  }
  "BUG-I" = @{
    scenarios   = @("569900523")
    export      = $ExportPath
    description = "Circuito de escape del loop de direccion da mensaje fuera de contexto"
  }
}

function Run-BugFix {
  param([string]$BugId, [hashtable]$Config)

  Write-Host ""
  Write-Host "=========================================="
  Write-Host "Arreglando $BugId : $($Config.description)"
  Write-Host "Escenarios: $($Config.scenarios -join ', ')"
  Write-Host "Export: $($Config.export)"
  Write-Host "=========================================="

  $args = @(
    "-ExportPath", $Config.export,
    "-BugScenarioKeys", $Config.scenarios,
    "-RegressionScenarioKeys", $REGRESSION_BASE,
    "-BugId", $BugId,
    "-JudgeTimeoutSec", "300"
  )

  if ($SkipRollbackOnRegression) {
    $args += "-SkipRollbackOnRegression"
  }

  & powershell -ExecutionPolicy Bypass -File "scripts/qa_fix_harness.ps1" @args
  return $LASTEXITCODE
}

$exitCode = 0

if ($Bug -eq "ALL") {
  foreach ($bugId in @("BUG-A","BUG-B","BUG-C","BUG-D","BUG-E","BUG-F","BUG-G","BUG-H","BUG-I")) {
    $result = Run-BugFix -BugId $bugId -Config $BUG_MAP[$bugId]
    if ($result -eq 1) {
      Write-Host "REGRESION en $bugId — deteniendo secuencia. Revisar antes de continuar."
      exit 1
    }
    if ($result -eq 2) {
      Write-Host "ADVERTENCIA: $bugId aun no resuelto (no hubo regresion). Continuando..."
      $exitCode = 2
    }
  }
} else {
  $exitCode = Run-BugFix -BugId $Bug -Config $BUG_MAP[$Bug]
}

exit $exitCode
