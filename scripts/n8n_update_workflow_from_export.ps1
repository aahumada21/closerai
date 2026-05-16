param(
  [Parameter(Mandatory = $true)]
  [string]$ExportPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Env([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Falta variable de entorno: $Name"
  }
  return $value.Trim()
}

if (-not (Test-Path $ExportPath)) {
  throw "No existe ExportPath: $ExportPath"
}

$baseUrl = (Require-Env "N8N_API_URL").TrimEnd('/')
$apiKey = Require-Env "N8N_API_KEY"

$headers = @{
  "X-N8N-API-KEY" = $apiKey
  "Accept" = "application/json"
  "Content-Type" = "application/json"
}

$export = Get-Content -Raw $ExportPath | ConvertFrom-Json
$id = "$($export.id)"
if ([string]::IsNullOrWhiteSpace($id)) {
  throw "El export no contiene id: $ExportPath"
}

# Traer workflow actual para reutilizar `settings` válidos según tu versión de n8n
$current = Invoke-RestMethod -Method Get -Uri ("$baseUrl/api/v1/workflows/$id") -Headers $headers
$currentSettings = @{}
if ($current -and $current.settings) { $currentSettings = $current.settings }

# n8n valida `settings` con un schema estricto. El GET puede incluir props que el PUT rechaza.
# Aplicamos whitelist de keys conocidas para evitar "additional properties".
$allowedSettingsKeys = @(
  "saveDataErrorExecution",
  "saveDataSuccessExecution",
  "saveExecutionProgress",
  "saveManualExecutions",
  "executionTimeout",
  "timezone",
  "errorWorkflow",
  "callerPolicy",
  "executionOrder",
  "executionMode",
  "concurrency",
  "maxExecutionTimeout",
  "retryOnFail",
  "retryCount",
  "retryDelay",
  "allowUnauthorizedCerts",
  "httpNodeCache"
)

$settingsFiltered = @{}
if ($currentSettings) {
  foreach ($k in $allowedSettingsKeys) {
    if ($currentSettings.PSObject.Properties.Match($k).Count -gt 0) {
      $settingsFiltered[$k] = $currentSettings.$k
    }
  }
}

# n8n API espera un payload con campos del workflow.
# Usamos un subconjunto seguro/compatible.
$payload = [ordered]@{
  name = $export.name
  nodes = $export.nodes
  connections = $export.connections
  settings = $settingsFiltered
}

$url = "$baseUrl/api/v1/workflows/$id"
$tryBodies = @(
  ($payload | ConvertTo-Json -Depth 100),
  (([ordered]@{ name = $export.name; nodes = $export.nodes; connections = $export.connections; settings = @{} }) | ConvertTo-Json -Depth 100)
)

$lastErr = $null
foreach ($b in $tryBodies) {
  try {
    $result = Invoke-RestMethod -Method Put -Uri $url -Headers $headers -Body $b
    Write-Host ("OK: actualizado workflow {0} ({1})" -f $id, $export.name)
    exit 0
  } catch {
    $lastErr = $_
    $msg = "$($_.Exception.Message)"

    $respBody = $null
    try {
      $resp = $_.Exception.Response
      if ($resp -and $resp.GetResponseStream) {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        $reader.Close()
      }
    } catch { }

    Write-Host "ERROR: fallo actualizando workflow via PUT"
    Write-Host ("- URL: {0}" -f $url)
    Write-Host ("- Mensaje: {0}" -f $msg)
    if ($respBody) {
      Write-Host ("- Response body: {0}" -f $respBody)
      New-Item -ItemType Directory -Force -Path "workflows/catalog" | Out-Null
      $errPath = "workflows/catalog/last_update_error.json"
      $respBody | Set-Content -Encoding UTF8 -Path $errPath
      Write-Host ("- Guardado: {0}" -f $errPath)
    }

    if ($msg -match "settings must NOT have additional properties") { continue }
    throw
  }
}

throw $lastErr
