param(
  [Parameter(Mandatory = $true)]
  [string]$TemplatePath,

  [Parameter(Mandatory = $false)]
  [string]$Category = "uncategorized"
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

if (-not (Test-Path $TemplatePath)) {
  throw "No existe TemplatePath: $TemplatePath"
}

$baseUrl = (Require-Env "N8N_API_URL").TrimEnd('/')
$apiKey = Require-Env "N8N_API_KEY"

$headers = @{
  "X-N8N-API-KEY" = $apiKey
  "Accept" = "application/json"
  "Content-Type" = "application/json"
}

$tpl = Get-Content -Raw $TemplatePath | ConvertFrom-Json

$payload = [ordered]@{
  name = $tpl.name
  nodes = $tpl.nodes
  connections = $tpl.connections
  settings = @{}
}

$createUrl = "$baseUrl/api/v1/workflows"
$body = ($payload | ConvertTo-Json -Depth 100)
$created = Invoke-RestMethod -Method Post -Uri $createUrl -Headers $headers -Body $body

$id = "$($created.id)"
if ([string]::IsNullOrWhiteSpace($id)) { throw "Respuesta sin id" }

New-Item -ItemType Directory -Force -Path ("workflows/exports/" + $Category) | Out-Null

function Normalize-FileName([string]$Name) {
  $invalid = [IO.Path]::GetInvalidFileNameChars()
  $safe = -join ($Name.ToCharArray() | ForEach-Object { if ($invalid -contains $_) { '_' } else { $_ } })
  $safe = $safe -replace '\s+', ' '
  $safe = $safe.Trim()
  if ($safe.Length -gt 160) { $safe = $safe.Substring(0, 160).Trim() }
  if ([string]::IsNullOrWhiteSpace($safe)) { $safe = "workflow" }
  return $safe
}

$safeName = Normalize-FileName $created.name
$flowNumber = ([regex]::Match($created.name, '^\s*(\d+(?:\.\d+)?)\b')).Groups[1].Value
$fileName = if ($flowNumber) { "$flowNumber - ${safeName}__id-$id.json" } else { "${safeName}__id-$id.json" }
$outPath = Join-Path ("workflows/exports/" + $Category) $fileName

($created | ConvertTo-Json -Depth 100) | Set-Content -Encoding UTF8 -Path $outPath
Write-Host ("OK: creado workflow {0} ({1})" -f $id, $created.name)
Write-Host ("Export: {0}" -f $outPath)
