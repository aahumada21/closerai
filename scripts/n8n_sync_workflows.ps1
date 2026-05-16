Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { return $false }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith('#')) { return }
    if ($line -notmatch '=') { return }

    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if (-not $key) { return }

    [Environment]::SetEnvironmentVariable($key, $value)
  }

  return $true
}

function Require-Env([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Falta variable de entorno: $Name"
  }
  return $value.Trim()
}

function Normalize-FileName([string]$Name) {
  $invalid = [IO.Path]::GetInvalidFileNameChars()
  $safe = -join ($Name.ToCharArray() | ForEach-Object { if ($invalid -contains $_) { '_' } else { $_ } })
  $safe = $safe -replace '\s+', ' '
  $safe = $safe.Trim()
  if ($safe.Length -gt 160) { $safe = $safe.Substring(0, 160).Trim() }
  if ([string]::IsNullOrWhiteSpace($safe)) { $safe = "workflow" }
  return $safe
}

function Get-WorkflowCategory($Tags) {
  $tags = @()
  if ($Tags) { $tags = @($Tags) | ForEach-Object { "$_".Trim() } | Where-Object { $_ } }
  $tagsNorm = @($tags | ForEach-Object { (("$($_)" -replace '\s+', ' ').Trim()).ToUpperInvariant() })
  $hasCloser = $tagsNorm -contains "CLOSER"
  $hasMain = $tagsNorm -contains "MAIN"
  $hasTool = $tagsNorm -contains "TOOL"
  $hasQA = $tagsNorm -contains "QA"

  if ($hasQA) { return "qa" }
  if ($hasTool) { return "tool" }
  if ($hasCloser -and $hasMain) { return "closer-main" }
  if ($hasCloser) { return "closer" }
  if ($hasMain) { return "main" }
  return "uncategorized"
}

function Parse-FlowNumber([string]$Name) {
  # Captura prefijos como "6", "6.1", "12.3" al inicio del nombre
  $m = [regex]::Match($Name, '^\s*(\d+(?:\.\d+)?)\b')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

# Si faltan env vars, intenta cargar desde `.env` en la raíz del repo.
if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("N8N_API_URL")) -or
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("N8N_API_KEY"))) {
  [void](Import-DotEnv ".env")
}

$baseUrl = Require-Env "N8N_API_URL"
$apiKey = Require-Env "N8N_API_KEY"

$baseUrl = $baseUrl.TrimEnd('/')
$headers = @{
  "X-N8N-API-KEY" = $apiKey
  "Accept" = "application/json"
}

New-Item -ItemType Directory -Force -Path "workflows/catalog" | Out-Null
New-Item -ItemType Directory -Force -Path "workflows/exports/uncategorized" | Out-Null

$inventory = [System.Collections.Generic.List[object]]::new()

function Invoke-ListWorkflowsPage([string]$BaseUrl, [hashtable]$Headers, [int]$Limit, [string]$Cursor, [int]$Offset) {
  $attempts = @(
    @{ name = "cursor"; url = if ($Cursor) { "$BaseUrl/api/v1/workflows?limit=$Limit&cursor=$Cursor" } else { "$BaseUrl/api/v1/workflows?limit=$Limit" } }
    @{ name = "offset"; url = "$BaseUrl/api/v1/workflows?limit=$Limit&offset=$Offset" }
    @{ name = "skip"; url = "$BaseUrl/api/v1/workflows?limit=$Limit&skip=$Offset" }
    @{ name = "take"; url = "$BaseUrl/api/v1/workflows?take=$Limit&skip=$Offset" }
  )

  $lastError = $null
  foreach ($a in $attempts) {
    try {
      $r = Invoke-RestMethod -Method Get -Uri $a.url -Headers $Headers
      return [pscustomobject]@{ mode = $a.name; resp = $r }
    } catch {
      $lastError = $_
      $msg = "$($_.Exception.Message)"
      # Si el server rechaza un query param, probamos el siguiente formato.
      if ($msg -match "Unknown query parameter") { continue }
      throw
    }
  }
  throw $lastError
}

$cursor = $null
$offset = 0
$perPage = 100
for (;;) {
  $result = Invoke-ListWorkflowsPage -BaseUrl $baseUrl -Headers $headers -Limit $perPage -Cursor $cursor -Offset $offset
  $resp = $result.resp

  $data = @()
  if ($resp.data) { $data = @($resp.data) }
  if ($data.Count -eq 0) { break }

  foreach ($wf in $data) {
    $id = $wf.id
    $name = "$($wf.name)"
    $tags = @()
    if ($wf.tags) { $tags = @($wf.tags | ForEach-Object { $_.name }) }
    # Export siempre a uncategorized (no dependemos de tags)
    $category = "uncategorized"
    $flowNumber = Parse-FlowNumber -Name $name

    $detailUrl = "$baseUrl/api/v1/workflows/$id"
    $detail = Invoke-RestMethod -Method Get -Uri $detailUrl -Headers $headers

    $safeName = Normalize-FileName -Name $name
    $fileName = if ($flowNumber) { "$flowNumber - ${safeName}__id-$id.json" } else { "${safeName}__id-$id.json" }
    $outPath = Join-Path "workflows/exports/uncategorized" $fileName

    ($detail | ConvertTo-Json -Depth 100) | Set-Content -Encoding UTF8 -Path $outPath

    $inventory.Add([pscustomobject]@{
      id = $id
      name = $name
      tags = $tags
      category = $category
      flow_number = $flowNumber
      export_path = ($outPath.Replace('\','/'))
      active = $wf.active
      updatedAt = $wf.updatedAt
      createdAt = $wf.createdAt
    })
  }

  if ($result.mode -eq "cursor") {
    $nextCursor = $null
    if ($resp.PSObject.Properties.Match('nextCursor').Count -gt 0 -and $resp.nextCursor) { $nextCursor = "$($resp.nextCursor)" }
    elseif ($resp.PSObject.Properties.Match('cursor').Count -gt 0 -and $resp.cursor) { $nextCursor = "$($resp.cursor)" }
    if ([string]::IsNullOrWhiteSpace($nextCursor)) { break }
    $cursor = $nextCursor
  } else {
    $offset += $perPage
  }
}

$invPath = "workflows/catalog/workflows.inventory.json"
($inventory | Sort-Object -Property @{Expression="category";Ascending=$true}, @{Expression="flow_number";Ascending=$true}, @{Expression="name";Ascending=$true} |
  ConvertTo-Json -Depth 10) | Set-Content -Encoding UTF8 -Path $invPath

Write-Host "OK: exportados $($inventory.Count) workflows."
Write-Host "Inventario: $invPath"
