param(
  [Parameter(Mandatory=$false)]
  [ValidateSet("A-1","A-2","A-3","A-4","A-5","A-6","A-7","A-8","B-1","B-2","B-3","C-1","C-2","C-3","D-1","D-2","ALL-A","ALL-B","ALL")]
  [string]$Fix = "ALL",
  [switch]$RunOnly
)

# Harness del ciclo QA automatico — Iteracion 1
# Ejecuta los escenarios fallidos y valida si los fixes funcionaron.
# Uso:
#   qa_cycle_harness.ps1 -Fix "A-1"    # solo el FAQ eco_products
#   qa_cycle_harness.ps1 -Fix "ALL-A"  # todos los FAQ faltantes
#   qa_cycle_harness.ps1 -Fix "ALL"    # todos los errores
#   qa_cycle_harness.ps1 -RunOnly      # solo re-corre sin aplicar fixes

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=',2
  [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
}
$db = $env:SUPABASE_DB_URL

$BUG_MAP = @{
  "A-1" = @{ key = "569900633"; desc = "FAQ eco_products — productos ecologicos" }
  "A-2" = @{ key = "569900637"; desc = "FAQ noise_level — ruido del servicio" }
  "A-3" = @{ key = "569900638"; desc = "FAQ cleaning_products — productos de limpieza" }
  "A-4" = @{ key = "569900641"; desc = "FAQ luxury_cars — Ferrari y autos de lujo" }
  "A-5" = @{ key = "569900643"; desc = "FAQ team_size — cuantas personas van" }
  "A-6" = @{ key = "569900645"; desc = "FAQ booking_channels — app y canales" }
  "A-7" = @{ key = "569900647"; desc = "FAQ partial_service — solo llantas" }
  "A-8" = @{ key = "569900648"; desc = "FAQ service_includes aspirado" }
  "B-1" = @{ key = "569900630"; desc = "BUG cotizar 2 servicios — solo responde 1" }
  "B-2" = @{ key = "569900631"; desc = "BUG cambio de comuna — no recotiza" }
  "B-3" = @{ key = "569900649"; desc = "BUG adelantar manana — no reconoce reagendamiento" }
  "C-1" = @{ key = "569900632"; desc = "INFRA GCal — direccion con landmark" }
  "C-2" = @{ key = "569900636"; desc = "INFRA GCal — confirmar por error" }
  "C-3" = @{ key = "569900642"; desc = "INFRA GCal — alarma en la direccion" }
  "D-1" = @{ key = "569900640"; desc = "DESIGN disponibilidad sabado" }
  "D-2" = @{ key = "569900646"; desc = "DESIGN llamada pendiente — derivar handoff" }
}

function Reset-And-Run([string]$scenarioKey, [int]$waitSec = 35) {
  $lid = (& psql $db -t -A -c "SELECT id FROM leads WHERE phone='$scenarioKey' ORDER BY created_at DESC LIMIT 1;").Trim()
  & psql $db -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]'::jsonb, booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$lid';" | Out-Null
  Write-Host "  reset $scenarioKey"
  & "scripts/qa_run_webhook.ps1" -ScenarioKey $scenarioKey -BatchWaitSeconds 3 | Out-Null
  Write-Host "  fired, esperando ${waitSec}s..."
  Start-Sleep -Seconds $waitSec
}

function Show-Result([string]$key) {
  $res = (& psql $db -t -A -c "SELECT llm_passed FROM qa_test_results WHERE scenario_id='$key' ORDER BY created_at DESC LIMIT 1;").Trim()
  $notes = (& psql $db -t -A -c "SELECT llm_notes FROM qa_test_results WHERE scenario_id='$key' ORDER BY created_at DESC LIMIT 1;").Trim() | Select-Object -First 1
  $lid = (& psql $db -t -A -c "SELECT id FROM leads WHERE phone='$key' ORDER BY created_at DESC LIMIT 1;").Trim()
  $msg = (& psql $db -t -A -c "SELECT content FROM messages WHERE lead_id='$lid'::uuid AND direction='outbound' ORDER BY created_at DESC LIMIT 1;").Trim() | Select-Object -First 1
  $status = if ($res -eq "t") { "PASS" } else { "FAIL" }
  Write-Host "  [$status] $key"
  Write-Host "  bot: $($msg.Substring(0, [Math]::Min(100, $msg.Length)))"
  if ($res -ne "t") { Write-Host "  notes: $($notes.Substring(0, [Math]::Min(150, $notes.Length)))" }
  return $res -eq "t"
}

$keysToRun = switch ($Fix) {
  "ALL-A" { "A-1","A-2","A-3","A-4","A-5","A-6","A-7","A-8" }
  "ALL-B" { "B-1","B-2","B-3" }
  "ALL"   { "A-1","A-2","A-3","A-4","A-5","A-6","A-7","A-8","B-1","B-2","B-3","C-1","C-2","C-3","D-1","D-2" }
  default { @($Fix) }
}

$pass = 0; $fail = 0
foreach ($k in $keysToRun) {
  $cfg = $BUG_MAP[$k]
  if (-not $cfg) { continue }
  Write-Host ""
  Write-Host "=== $k : $($cfg.desc) ==="
  Reset-And-Run $cfg.key -waitSec (if ($cfg.key -match "569900636|569900632|569900642") { 180 } else { 35 })
  if (Show-Result $cfg.key) { $pass++ } else { $fail++ }
}
Write-Host ""
Write-Host "HARNESS RESULT: $pass pasaron, $fail fallaron de $($keysToRun.Count) ejecutados"
