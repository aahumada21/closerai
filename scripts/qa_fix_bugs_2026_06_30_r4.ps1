param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("BUG-512","BUG-547","BUG-550","BUG-558","BUG-559","ALL")]
  [string]$Bug
)

# Arnes Ronda 4 — 5 bugs restantes del batch 2026-06-30 (55/60)
#
# Uso:
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-512"   # redisena escenario
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-547"   # fix vehiculo mediano
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-550"   # redisena escenario
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-558"   # solo verifica
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "BUG-559"   # fix encoding + duracion
#   scripts/qa_fix_bugs_2026_06_30_r4.ps1 -Bug "ALL"       # todos en secuencia

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $p = $_ -split '=',2
  [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim())
}
$db = $env:SUPABASE_DB_URL
$apiUrl = $env:N8N_API_URL
$apiKey = $env:N8N_API_KEY

function Reset-Lead([string]$phone) {
  $lid = (& psql $db -t -A -c "SELECT id FROM leads WHERE phone='$phone' ORDER BY created_at DESC LIMIT 1;").Trim()
  & psql $db -c "UPDATE lead_state SET stage='new_lead', human_handoff=false, intent_last=NULL, next_goal=NULL, last_bot_action=NULL, address_collection_attempts=0, service_interest=NULL, vehicle_type=NULL, district=NULL, booking_options='[]'::jsonb, booking_date=NULL, booking_time=NULL, slot_id=NULL, service_address=NULL WHERE lead_id='$lid';" | Out-Null
  Write-Host "  reset $phone ($lid)"
  return $lid
}

function Run-And-Wait([string]$key, [int]$waitSec = 90) {
  & "scripts/qa_run_webhook.ps1" -ScenarioKey $key -BatchWaitSeconds 5 | Out-Null
  Write-Host "  fired $key, esperando ${waitSec}s..."
  Start-Sleep -Seconds $waitSec
}

function Show-Result([string]$lid, [string]$key) {
  Write-Host "`n=== MENSAJES ==="
  & psql $db -c "SELECT direction, content FROM messages WHERE lead_id='$lid' ORDER BY created_at ASC;"
  Write-Host "`n=== JUEZ ==="
  & psql $db -c "SELECT llm_passed, llm_notes FROM qa_test_results WHERE scenario_id='$key' ORDER BY created_at DESC LIMIT 1;"
}

# ---------------------------------------------------------------------------
function Fix-512 {
  Write-Host "`n========== BUG-512: redisenar escenario reagendamiento =========="
  # Agregar pasos de booking completo antes del reagendamiento
  $meta = '{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}'
  $newSteps = @"
[
  {"text":"cuanto sale el lavado basico para un sedan en providencia","source_metadata":$meta},
  {"text":"si, mandame los horarios","source_metadata":$meta},
  {"text":"la 1","source_metadata":$meta},
  {"text":"Av Providencia 1234","source_metadata":$meta},
  {"text":"si, confirma","source_metadata":$meta},
  {"text":"muchas gracias","source_metadata":$meta},
  {"text":"todo bien","source_metadata":$meta},
  {"text":"listo","source_metadata":$meta},
  {"text":"necesito cambiar la hora de mi reserva","source_metadata":$meta},
  {"text":"mandame los horarios disponibles","source_metadata":$meta}
]
"@
  & psql $db -c "UPDATE qa_test_scenarios_temp SET steps='$newSteps'::jsonb, expected_outcome='El bot debe confirmar la reserva en los pasos 1-5, y luego cuando el usuario dice necesito cambiar la hora, el bot debe reconocer la reserva activa y ofrecer horarios alternativos para reagendar.', updated_at=NOW() WHERE scenario_key='569900512';" | Out-Null
  Write-Host "  escenario 512 rediseñado (10 pasos)"
  $lid = Reset-Lead "569900512"
  Run-And-Wait "569900512" 180
  Show-Result $lid "569900512"
}

# ---------------------------------------------------------------------------
function Fix-547 {
  Write-Host "`n========== BUG-547: vehiculo 'mediano' sin mapeo =========="
  Write-Host "  Este bug requiere fix en rules_engine (ruleVehicleRuralNeedsClarification)"
  Write-Host "  o en ruleMissingRequiredFields para detectar 'mediano'/'grande'/'chico'."
  Write-Host ""
  Write-Host "  PASOS MANUALES:"
  Write-Host "  1. Abrir 3 rules_engine en n8n"
  Write-Host "  2. En rules_evaluation, buscar ruleVehicleRuralNeedsClarification"
  Write-Host "  3. Agregar deteccion de 'mediano','grande','chico','compacto','pick up'"
  Write-Host "     como descriptores validos de vehiculo que activan la clarificacion"
  Write-Host "  4. Mensaje de clarificacion mejorado:"
  Write-Host "     'Para cotizarte bien: si tu auto es sedan, hatchback o similar (tamano"
  Write-Host "     normal) corresponde a AUTO. Si es mas voluminoso (SUV, jeep, minivan)"
  Write-Host "     es SUV. Si es camioneta pickup es CAMIONETA. Cual es el tuyo?'"
  Write-Host ""
  $lid = Reset-Lead "569900547"
  Run-And-Wait "569900547" 30
  Show-Result $lid "569900547"
}

# ---------------------------------------------------------------------------
function Fix-550 {
  Write-Host "`n========== BUG-550: agregar pasos de direccion y confirmacion =========="
  $meta = '{"provider":"meta_whatsapp_cloud_api","phone_number_id":"qa-phone-ahumada-agent-aware"}'
  $newSteps = @"
[
  {"text":"hola","source_metadata":$meta},
  {"text":"quiero cotizar un lavado","source_metadata":$meta},
  {"text":"es premium","source_metadata":$meta},
  {"text":"tengo un suv","source_metadata":$meta},
  {"text":"vivo en huechuraba","source_metadata":$meta},
  {"text":"dale, mandame los horarios","source_metadata":$meta},
  {"text":"la primera que ofreciste","source_metadata":$meta},
  {"text":"Av Las Condes 1234","source_metadata":$meta},
  {"text":"si, confirma","source_metadata":$meta}
]
"@
  & psql $db -c "UPDATE qa_test_scenarios_temp SET steps='$newSteps'::jsonb, expected_outcome='A lo largo de 9 turnos entregando datos de a poco, el bot no debe perder ningún dato ya entregado (servicio, vehiculo, comuna). Debe llegar a confirmar la reserva final con servicio=lavado premium, vehiculo=SUV, comuna=Huechuraba, y la direccion dada en el paso 8.', updated_at=NOW() WHERE scenario_key='569900550';" | Out-Null
  Write-Host "  escenario 550 actualizado a 9 pasos"
  $lid = Reset-Lead "569900550"
  Run-And-Wait "569900550" 180
  Show-Result $lid "569900550"
}

# ---------------------------------------------------------------------------
function Fix-558 {
  Write-Host "`n========== BUG-558: verificar que expected_outcome actualizado pasa =========="
  $lid = Reset-Lead "569900558"
  Run-And-Wait "569900558" 30
  Show-Result $lid "569900558"
  Write-Host ""
  Write-Host "  Si sigue fallando: el bot agrega 'dime que servicio, vehiculo, comuna'"
  Write-Host "  al final de la respuesta de pagos. Fix: agregar excepcion en la regla"
  Write-Host "  de FAQ para no pedir datos de cotizacion despues de responder pagos."
}

# ---------------------------------------------------------------------------
function Fix-559 {
  Write-Host "`n========== BUG-559: encoding tildes + duracion desde config =========="
  Write-Host "  Investigando encoding en 6.9 answer_question y 6.1 send_outbound_message..."

  # Buscar el workflow de answer_question
  $wfList = (Invoke-RestMethod -Uri "$apiUrl/api/v1/workflows" -Headers @{"X-N8N-API-KEY"=$apiKey}).data
  $aqWf = $wfList | Where-Object { $_.name -eq "6.9 answer_question" }
  Write-Host "  6.9 id: $($aqWf.id)"
  $soWf = $wfList | Where-Object { $_.name -eq "6.1 send_outbound_message" }
  Write-Host "  6.1 id: $($soWf.id)"

  Write-Host ""
  Write-Host "  PASOS DE INVESTIGACION:"
  Write-Host "  1. Fetch 6.9 answer_question desde la API"
  Write-Host "  2. Buscar cualquier Code node que procese el mensaje"
  Write-Host "  3. Verificar si hay .replace() o regex que elimine tildes"
  Write-Host "  4. Si el problema esta en el LLM, agregar instruccion en el system prompt"
  Write-Host "     para que use caracteres con tilde (a, e, i, o, u con acento)"
  Write-Host "  5. Para la duracion: agregar en rules_evaluation deteccion de pregunta"
  Write-Host "     'cuanto demora'/'cuanto tarda' y responder desde agent_config.services"
  Write-Host ""
  $lid = Reset-Lead "569900559"
  Run-And-Wait "569900559" 30
  Show-Result $lid "569900559"
}

# ---------------------------------------------------------------------------
switch ($Bug) {
  "BUG-512" { Fix-512 }
  "BUG-547" { Fix-547 }
  "BUG-550" { Fix-550 }
  "BUG-558" { Fix-558 }
  "BUG-559" { Fix-559 }
  "ALL" {
    Fix-558    # verificacion simple primero
    Fix-512    # rediseno escenario
    Fix-550    # rediseno escenario
    Fix-547    # investigacion manual
    Fix-559    # investigacion encoding
  }
}
