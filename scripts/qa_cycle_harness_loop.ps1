param(
  [ValidateSet("A-1","A-2","A-3","A-4","A-5","B-1","B-2","C-1","C-2","C-3","C-4","C-5","ALL-A","ALL-B","ALL-C","ALL")]
  [string]$Fix = "ALL"
)
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=',2; [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
}
$db = $env:SUPABASE_DB_URL
$BUG_MAP = @{
  "A-1" = @{ key="569900731"; desc="FAQ no_memory" }
  "A-2" = @{ key="569900737"; desc="FAQ company_invoice" }
  "A-3" = @{ key="569900738"; desc="FAQ service_history" }
  "A-4" = @{ key="569900741"; desc="FAQ damage_insurance key fix" }
  "A-5" = @{ key="569900743"; desc="FAQ technician_name" }
  "B-1" = @{ key="569900744"; desc="BUG complaint post-service" }
  "B-2" = @{ key="569900739"; desc="BUG emojis block extraction" }
  "C-1" = @{ key="569900732"; desc="expected_outcome address number" }
  "C-2" = @{ key="569900736"; desc="expected_outcome recommend premium" }
  "C-3" = @{ key="569900742"; desc="expected_outcome same-day urgency" }
  "C-4" = @{ key="569900745"; desc="expected_outcome formal message" }
  "C-5" = @{ key="569900749"; desc="expected_outcome show availability" }
}
$keysToRun = switch ($Fix) {
  "ALL-A" { "A-1","A-2","A-3","A-4","A-5" }
  "ALL-B" { "B-1","B-2" }
  "ALL-C" { "C-1","C-2","C-3","C-4","C-5" }
  "ALL"   { $BUG_MAP.Keys | Sort-Object }
  default { @($Fix) }
}
$pass=0; $fail=0
foreach ($k in $keysToRun) {
  $cfg = $BUG_MAP[$k]; if (-not $cfg) { continue }
  Write-Host "=== $k : $($cfg.desc) ==="
  $lid = (& psql $db -t -A -c "SELECT id FROM leads WHERE phone='$($cfg.key)' ORDER BY created_at DESC LIMIT 1;").Trim()
  & psql $db -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]'::jsonb, booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$lid';" | Out-Null
  & "scripts/qa_run_webhook.ps1" -ScenarioKey $cfg.key -BatchWaitSeconds 3 | Out-Null
  Write-Host "  fired, waiting 40s..."; Start-Sleep -Seconds 40
  $res = (& psql $db -t -A -c "SELECT llm_passed FROM qa_test_results WHERE scenario_id='$($cfg.key)' ORDER BY created_at DESC LIMIT 1;").Trim()
  $msg = (& psql $db -t -A -c "SELECT content FROM messages WHERE lead_id='$lid'::uuid AND direction='outbound' ORDER BY created_at DESC LIMIT 1;").Trim() | Select-Object -First 1
  $status = if ($res -eq "t") { "PASS"; $pass++ } else { "FAIL"; $fail++ }
  Write-Host "  [$status] $($msg.Substring(0,[Math]::Min(100,$msg.Length)))"
}
Write-Host "HARNESS: $pass pass, $fail fail"
