param(
  [string]$WorkflowExportPath = "workflows/exports/uncategorized/6.1 - 6.1 send_outbound_message__id-a0d615e2-41de-4f01-bb5a-2a5bee00d803.json",
  [string]$OutputPath = "QA/results/qa_prd_phaseL_461_outbound_send_failure.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $WorkflowExportPath)) {
  throw "No existe workflow export: $WorkflowExportPath"
}

$workflow = Get-Content -Raw -LiteralPath $WorkflowExportPath | ConvertFrom-Json
$nodes = @($workflow.nodes)

$normalizeNode = $nodes | Where-Object { $_.name -eq "normalize_provider_response" } | Select-Object -First 1
$finalNode = $nodes | Where-Object { $_.name -eq "final_outbound_result" } | Select-Object -First 1
$validateNode = $nodes | Where-Object { $_.name -eq "validate_outbound_input" } | Select-Object -First 1

$errors = @()

if (-not $normalizeNode) { $errors += "missing node normalize_provider_response" }
if (-not $finalNode) { $errors += "missing node final_outbound_result" }
if (-not $validateNode) { $errors += "missing node validate_outbound_input" }

$normalizeCode = if ($normalizeNode) { [string]$normalizeNode.parameters.jsCode } else { "" }
$finalCode = if ($finalNode) { [string]$finalNode.parameters.jsCode } else { "" }
$validateCode = if ($validateNode) { [string]$validateNode.parameters.jsCode } else { "" }

$staticChecks = [ordered]@{
  detects_provider_error = $normalizeCode.Contains("providerResponse.error") -and $normalizeCode.Contains("hasError")
  marks_message_sent_false_on_error = $normalizeCode.Contains("message_sent: !hasError")
  marks_success_false_on_error = $normalizeCode.Contains("success: !hasError")
  marks_provider_status_failed = $normalizeCode.Contains("provider_status: hasError ? `"failed`" : `"accepted`"")
  preserves_provider_error = $normalizeCode.Contains("provider_error: hasError ? providerResponse.error : null")
  preserves_provider_raw_response = $normalizeCode.Contains("provider_raw_response: providerResponse")
  final_result_does_not_force_sent = -not ($finalCode -match "message_sent\s*:\s*true")
  validates_required_message = $validateCode.Contains("Invalid message")
  validates_required_phone = $validateCode.Contains("Missing phone")
}

foreach ($entry in $staticChecks.GetEnumerator()) {
  if (-not $entry.Value) {
    $errors += "static check failed: $($entry.Key)"
  }
}

$originalInput = @{
  lead_id = "00000000-0000-0000-0000-000000000461"
  phone = "56900000461"
  channel = "whatsapp"
  message = "QA outbound failure probe"
  message_type = "qa"
  source = "qa_outbound_send_failure"
}

$providerResponse = @{
  error = @{
    code = 131000
    message = "QA simulated WhatsApp provider failure"
    type = "OAuthException"
  }
}

$hasError = $null -ne $providerResponse.error
$emulatedNormalizeResult = @{
  lead_id = $originalInput.lead_id
  phone = $originalInput.phone
  channel = $originalInput.channel
  message = $originalInput.message
  message_type = $originalInput.message_type
  source = $originalInput.source
  success = -not $hasError
  message_sent = -not $hasError
  provider_message_id = $null
  provider_status = if ($hasError) { "failed" } else { "accepted" }
  provider_error = if ($hasError) { $providerResponse.error } else { $null }
  provider_raw_response = $providerResponse
}

$emulatedFinalResult = @{
  lead_id = $emulatedNormalizeResult.lead_id
  phone = $emulatedNormalizeResult.phone
  channel = $emulatedNormalizeResult.channel
  message = $emulatedNormalizeResult.message
  message_type = $emulatedNormalizeResult.message_type
  source = $emulatedNormalizeResult.source
  success = $emulatedNormalizeResult.success
  message_sent = $emulatedNormalizeResult.message_sent
  provider_message_id = $emulatedNormalizeResult.provider_message_id
  provider_status = $emulatedNormalizeResult.provider_status
  provider_error = $emulatedNormalizeResult.provider_error
  provider_raw_response = $emulatedNormalizeResult.provider_raw_response
  outbound_completed = $true
}

if ($emulatedFinalResult.success -ne $false) {
  $errors += "emulation failed: success should be false"
}
if ($emulatedFinalResult.message_sent -ne $false) {
  $errors += "emulation failed: message_sent should be false"
}
if ($emulatedFinalResult.provider_status -ne "failed") {
  $errors += "emulation failed: provider_status should be failed"
}
if (-not $emulatedFinalResult.provider_error) {
  $errors += "emulation failed: provider_error should be preserved"
}
if ($emulatedFinalResult.provider_message_id) {
  $errors += "emulation failed: provider_message_id should be null on failure"
}

$passed = $errors.Count -eq 0

$result = [ordered]@{
  scenario_key = "569900461"
  name = "PRD QA461: outbound_send_failure registra error y no marca enviado"
  passed = $passed
  checked_at = (Get-Date).ToUniversalTime().ToString("o")
  workflow_export = $WorkflowExportPath
  static_checks = $staticChecks
  emulated_failure_result = $emulatedFinalResult
  errors = $errors
}

$directory = Split-Path -Parent $OutputPath
if ($directory) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
$result | ConvertTo-Json -Depth 20 | Out-File -Encoding utf8 $OutputPath

if ($passed) {
  Write-Host "OK: QA461 passed. Result: $OutputPath"
} else {
  Write-Host "FAIL: QA461 failed. Result: $OutputPath"
  exit 1
}
