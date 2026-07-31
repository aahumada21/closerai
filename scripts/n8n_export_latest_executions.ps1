param(
  [int]$PerWorkflow = 15,
  [string]$OutputRoot = "workflows/executions_snapshot",
  [switch]$OnlyActiveMain,
  [switch]$AllWorkflows
)

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

function Get-MainWorkflowsFromInventory([string]$InventoryPath, [switch]$OnlyActive) {
  if (-not (Test-Path $InventoryPath)) {
    throw "No existe inventario: $InventoryPath. Ejecuta primero scripts/n8n_sync_workflows.ps1"
  }

  $raw = Get-Content -Raw -LiteralPath $InventoryPath | ConvertFrom-Json
  $target = @("1", "2", "3", "4", "5", "6")

  $items = @($raw | Where-Object {
      $target -contains "$($_.flow_number)"
    })

  if ($OnlyActive) {
    $items = @($items | Where-Object { $_.active -eq $true })
  }

  return @($items | Sort-Object { [int]$_.flow_number })
}

function Get-AllWorkflowsFromInventory([string]$InventoryPath, [switch]$OnlyActive) {
  if (-not (Test-Path $InventoryPath)) {
    throw "No existe inventario: $InventoryPath. Ejecuta primero scripts/n8n_sync_workflows.ps1"
  }

  $raw = Get-Content -Raw -LiteralPath $InventoryPath | ConvertFrom-Json
  $items = @($raw)

  if ($OnlyActive) {
    $items = @($items | Where-Object { $_.active -eq $true })
  }

  return @($items | Sort-Object name)
}

function Invoke-ExecutionList([string]$BaseUrl, [hashtable]$Headers, [string]$WorkflowId, [int]$Limit) {
  $attempts = @(
    "$BaseUrl/api/v1/executions?workflowId=$WorkflowId&limit=$Limit",
    "$BaseUrl/api/v1/executions?workflowId=$WorkflowId&take=$Limit",
    "$BaseUrl/api/v1/executions?workflowId=$WorkflowId&pageSize=$Limit"
  )

  $lastErr = $null
  foreach ($url in $attempts) {
    try {
      $resp = Invoke-RestMethod -Method Get -Uri $url -Headers $Headers
      return $resp
    } catch {
      $lastErr = $_
      continue
    }
  }
  throw $lastErr
}

function Invoke-ExecutionDetail([string]$BaseUrl, [hashtable]$Headers, [string]$ExecutionId) {
  $attempts = @(
    "$BaseUrl/api/v1/executions/$ExecutionId?includeData=true",
    "$BaseUrl/api/v1/executions/$ExecutionId?includeData=1",
    "$BaseUrl/api/v1/executions/$ExecutionId"
  )

  $lastErr = $null
  foreach ($url in $attempts) {
    try {
      return Invoke-RestMethod -Method Get -Uri $url -Headers $Headers
    } catch {
      $lastErr = $_
      continue
    }
  }
  throw $lastErr
}

if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("N8N_API_URL")) -or
    [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable("N8N_API_KEY"))) {
  [void](Import-DotEnv ".env")
}

$baseUrl = (Require-Env "N8N_API_URL").TrimEnd('/')
$apiKey = Require-Env "N8N_API_KEY"
$headers = @{
  "X-N8N-API-KEY" = $apiKey
  "Accept" = "application/json"
}

$inventoryPath = "workflows/catalog/workflows.inventory.json"
$workflows = if ($AllWorkflows) {
  Get-AllWorkflowsFromInventory -InventoryPath $inventoryPath -OnlyActive:$OnlyActiveMain
} else {
  Get-MainWorkflowsFromInventory -InventoryPath $inventoryPath -OnlyActive:$OnlyActiveMain
}

if ($workflows.Count -eq 0) {
  if ($AllWorkflows) {
    throw "No se encontraron workflows en inventario."
  } else {
    throw "No se encontraron workflows main (1..6) en inventario."
  }
}

$timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
$outputBase = Join-Path $OutputRoot $timestamp
New-Item -ItemType Directory -Force -Path $outputBase | Out-Null

$summary = [System.Collections.Generic.List[object]]::new()
$allMeta = [System.Collections.Generic.List[object]]::new()
$perFlowOrdered = @{}

foreach ($wf in $workflows) {
  $flowNum = "$($wf.flow_number)"
  Write-Host "Exportando ejecuciones de flujo $flowNum ($($wf.name))..."
  $listResp = Invoke-ExecutionList -BaseUrl $baseUrl -Headers $headers -WorkflowId "$($wf.id)" -Limit $PerWorkflow

  $data = @()
  if ($listResp -and $listResp.PSObject.Properties.Match('data').Count -gt 0 -and $listResp.data) {
    $data = @($listResp.data)
  } elseif ($listResp -and $listResp.PSObject.Properties.Match('items').Count -gt 0 -and $listResp.items) {
    $data = @($listResp.items)
  } elseif ($listResp -and $listResp.PSObject.Properties.Match('executions').Count -gt 0 -and $listResp.executions) {
    $data = @($listResp.executions)
  } elseif ($listResp -is [array]) {
    $data = @($listResp)
  }

  $ordered = @($data | Sort-Object -Property @{ Expression = {
      if ($_.PSObject.Properties.Match('startedAt').Count -gt 0) { $_.startedAt }
      elseif ($_.PSObject.Properties.Match('started_at').Count -gt 0) { $_.started_at }
      else { $null }
    }; Descending = $true })
  if ($ordered.Count -gt $PerWorkflow) {
    $ordered = @($ordered | Select-Object -First $PerWorkflow)
  }

  $perFlowOrdered[$flowNum] = $ordered
  foreach ($exec in $ordered) {
    $execId = if ($exec.PSObject.Properties.Match('id').Count -gt 0) { "$($exec.id)" } else { "" }
    if ([string]::IsNullOrWhiteSpace($execId)) { continue }
    $startedAtValue = if ($exec.PSObject.Properties.Match('startedAt').Count -gt 0) { "$($exec.startedAt)" } elseif ($exec.PSObject.Properties.Match('started_at').Count -gt 0) { "$($exec.started_at)" } else { "" }
    $startedAtDate = $null
    try { if (-not [string]::IsNullOrWhiteSpace($startedAtValue)) { $startedAtDate = [DateTime]::Parse($startedAtValue) } } catch { $startedAtDate = $null }
    $allMeta.Add([pscustomobject]@{
      flow_number = $flowNum
      workflow_id = "$($wf.id)"
      workflow_name = "$($wf.name)"
      exec_id = $execId
      started_at = $startedAtValue
      started_at_date = $startedAtDate
    })
  }
}

# Cortar ejecuciones "anteriores al inicio en 1 Inbound_router" solo en modo main.
$cutoff = $null
if (-not $AllWorkflows) {
  $flow1Meta = @($allMeta | Where-Object { $_.flow_number -eq "1" -and $_.started_at_date -ne $null } | Sort-Object started_at_date)
  if ($flow1Meta.Count -gt 0) {
    $cutoff = $flow1Meta[0].started_at_date
    Write-Host "Cutoff detectado por flujo 1: $($cutoff.ToString('o'))"
  } else {
    Write-Host "WARN: no se detectó timestamp válido para flujo 1; no se recortará por inicio."
  }
}

foreach ($wf in $workflows) {
  $flowNum = "$($wf.flow_number)"
  $folder = $outputBase

  $ordered = @($perFlowOrdered[$flowNum])
  $selected = @()
  foreach ($exec in $ordered) {
    $execId = if ($exec.PSObject.Properties.Match('id').Count -gt 0) { "$($exec.id)" } else { "" }
    if ([string]::IsNullOrWhiteSpace($execId)) { continue }

    $meta = $allMeta | Where-Object { $_.flow_number -eq $flowNum -and $_.exec_id -eq $execId } | Select-Object -First 1
    if ($cutoff -ne $null -and $meta -and $meta.started_at_date -ne $null) {
      if ($meta.started_at_date -lt $cutoff) { continue }
    }
    $selected += $exec
  }

  $index = 0
  foreach ($exec in $selected) {
    $index++
    $execId = if ($exec.PSObject.Properties.Match('id').Count -gt 0) { "$($exec.id)" } else { "" }
    if ([string]::IsNullOrWhiteSpace($execId)) { continue }

    $detail = Invoke-ExecutionDetail -BaseUrl $baseUrl -Headers $headers -ExecutionId $execId
    $startedAtValue = if ($exec.PSObject.Properties.Match('startedAt').Count -gt 0) { "$($exec.startedAt)" } elseif ($exec.PSObject.Properties.Match('started_at').Count -gt 0) { "$($exec.started_at)" } else { "" }
    $safeStarted = ($startedAtValue -replace "[:T]", "-" -replace "Z", "") -replace "[^0-9\-]", ""
    if ([string]::IsNullOrWhiteSpace($safeStarted)) { $safeStarted = "no-date" }
    $safeFlow = if ([string]::IsNullOrWhiteSpace($flowNum)) { "no-flow" } else { $flowNum }
    $workflowId = "$($wf.id)"
    $fileName = "{0}__{1:D2}__exec-{2}__wf-{3}__{4}.json" -f $safeFlow, $index, $execId, $workflowId, $safeStarted
    $outFile = Join-Path $folder $fileName
    ($detail | ConvertTo-Json -Depth 100) | Set-Content -LiteralPath $outFile -Encoding UTF8
  }

  $summary.Add([pscustomobject]@{
    flow_number = $flowNum
    workflow_id = "$($wf.id)"
    workflow_name = "$($wf.name)"
    exported_count = $selected.Count
    output_folder = ($outputBase.Replace('\', '/'))
    cutoff_started_at = if ($cutoff -ne $null) { $cutoff.ToString("o") } else { $null }
  })
}

$summaryPath = Join-Path $outputBase "summary.json"
($summary | ConvertTo-Json -Depth 10) | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host ""
Write-Host "OK: exportadas ejecuciones."
Write-Host "Salida: $outputBase"
Write-Host "Resumen: $summaryPath"
