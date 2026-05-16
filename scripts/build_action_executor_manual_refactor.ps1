param(
  [Parameter(Mandatory = $false)]
  [string]$SourcePath = "workflows/exports/manual/6 - 6 action_executor__manual_import_patched.json",

  [Parameter(Mandatory = $false)]
  [string]$OutPath = "workflows/exports/manual/6 - 6 action_executor__manual_import_refactor_subworkflows.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourcePath)) { throw "No existe SourcePath: $SourcePath" }

$wf = Get-Content -Raw $SourcePath | ConvertFrom-Json

$map = @(
  @{ action = "ask_missing_data"; sub = "6.7 ask_missing_data"; nodeName = "Call 6.7 ask_missing_data"; outIndex = 0 }
  @{ action = "send_quote"; sub = "6.8 send_quote"; nodeName = "Call 6.8 send_quote"; outIndex = 1 }
  @{ action = "answer_question"; sub = "6.9 answer_question"; nodeName = "Call 6.9 answer_question"; outIndex = 2 }
  @{ action = "answer_objection"; sub = "6.19 answer_objection"; nodeName = "Call 6.19 answer_objection"; outIndex = 3 }
  @{ action = "offer_booking"; sub = "6.20 offer_booking"; nodeName = "Call 6.20 offer_booking"; outIndex = 4 }
  @{ action = "schedule_followup"; sub = "6.21 schedule_followup"; nodeName = "Call 6.21 schedule_followup"; outIndex = 6 }
  @{ action = "handoff_human"; sub = "6.22 handoff_human"; nodeName = "Call 6.22 handoff_human"; outIndex = 7 }
  @{ action = "offer_available_slots"; sub = "6.23 offer_available_slots"; nodeName = "Call 6.23 offer_available_slots"; outIndex = 8 }
)

function Get-Node([string]$name) {
  return $wf.nodes | Where-Object { $_.name -eq $name } | Select-Object -First 1
}

# Build a mutable node list
$nodes = New-Object System.Collections.ArrayList
foreach ($n in @($wf.nodes)) { [void]$nodes.Add($n) }

# Remove original action code nodes
$remove = $map | ForEach-Object { $_.action }
for ($i = $nodes.Count - 1; $i -ge 0; $i--) {
  if ($remove -contains $nodes[$i].name) { $nodes.RemoveAt($i) }
}

# Ensure action_router output mapping exists
if (-not $wf.connections.action_router -or -not $wf.connections.action_router.main) {
  throw "No existe connections.action_router.main"
}

$routerMain = @($wf.connections.action_router.main)
if ($routerMain.Count -lt 19) { throw "action_router.main no tiene 19 outputs" }

foreach ($e in $map) {
  $orig = Get-Node $e.action
  if (-not $orig) { throw "No existe node original: $($e.action)" }

  $posX = [double]$orig.position[0]
  $posY = [double]$orig.position[1]

  $execNode = [pscustomobject]@{
    parameters = @{
      workflowId = @{
        __rl = $true
        value = ""
        mode = "list"
        cachedResultName = $e.sub
      }
      workflowInputs = @{
        mappingMode = "defineBelow"
        value = @{
          payload = '={{ JSON.stringify($json) }}'
        }
        matchingColumns = @()
        schema = @(
          @{
            id = "payload"
            displayName = "payload"
            required = $false
            defaultMatch = $false
            display = $true
            canBeUsedToMatch = $true
            type = "string"
            removed = $false
          }
        )
        attemptToConvertTypes = $false
        convertFieldsToString = $true
      }
      options = @{}
    }
    type = "n8n-nodes-base.executeWorkflow"
    typeVersion = 1.3
    position = @($posX, $posY)
    name = $e.nodeName
  }

  [void]$nodes.Add($execNode)

  # Update router connection target
  if ($routerMain[$e.outIndex] -is [System.Array]) {
    $routerMain[$e.outIndex][0].node = $e.nodeName
  } else {
    $routerMain[$e.outIndex].node = $e.nodeName
  }
  $wf.connections.action_router.main = $routerMain

  # Remove old connection entry for original action node if present
  if ($wf.connections.PSObject.Properties.Match($e.action).Count -gt 0) {
    $wf.connections.PSObject.Properties.Remove($e.action) | Out-Null
  }

  # Add connection entry for the new execute node
  $wf.connections | Add-Member -Force -NotePropertyName $e.nodeName -NotePropertyValue @{
    main = @(
      @(
        @{
          node = "IF requires_message"
          type = "main"
          index = 0
        }
      )
    )
  }
}

$wf.nodes = @($nodes)
$wf.name = "6 action_executor (manual import refactor subworkflows)"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutPath) | Out-Null
($wf | ConvertTo-Json -Depth 100) | Set-Content -Encoding UTF8 -Path $OutPath
Write-Host "OK: $OutPath"
