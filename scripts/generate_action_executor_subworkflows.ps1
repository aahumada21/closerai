param(
  [Parameter(Mandatory = $false)]
  [string]$ActionExecutorExportPath = "workflows/exports/closer-main/6 - 6 action_executor__id-ze9SfDhb6PvlRFks.json",
  [Parameter(Mandatory = $false)]
  [string]$OutDir = "workflows/modules/action_executor"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $ActionExecutorExportPath)) {
  throw "No existe: $ActionExecutorExportPath"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$src = Get-Content -Raw $ActionExecutorExportPath | ConvertFrom-Json

$map = @(
  @{ action = "ask_missing_data"; number = "6.7" }
  @{ action = "send_quote"; number = "6.8" }
  @{ action = "answer_question"; number = "6.9" }
  @{ action = "answer_objection"; number = "6.19" }
  @{ action = "offer_booking"; number = "6.20" }
  @{ action = "schedule_followup"; number = "6.21" }
  @{ action = "handoff_human"; number = "6.22" }
  @{ action = "offer_available_slots"; number = "6.23" }
)

function New-Node([string]$Name, [string]$Type, [object]$Parameters, [double[]]$Pos) {
  return [ordered]@{
    parameters = $Parameters
    id = ([guid]::NewGuid().ToString())
    name = $Name
    type = $Type
    typeVersion = 2
    position = $Pos
  }
}

$count = 0
foreach ($entry in $map) {
  $action = $entry.action
  $number = $entry.number

  $codeNode = $src.nodes | Where-Object { $_.name -eq $action -and $_.type -eq "n8n-nodes-base.code" } | Select-Object -First 1
  if (-not $codeNode) {
    Write-Warning "No se encontró Code node para action '$action' en $ActionExecutorExportPath"
    continue
  }

  $wfName = "$number $action"
  $trigger = [ordered]@{
    parameters = @{
      inputSource = "jsonExample"
      jsonExample = @'
{
  "payload": "={{ JSON.stringify($json) }}"
}
'@
    }
    id = ([guid]::NewGuid().ToString())
    name = $wfName
    type = "n8n-nodes-base.executeWorkflowTrigger"
    typeVersion = 1.1
    position = @(
      260,
      360
    )
  }

  $normalizeJs = @'
function parseMaybeJson(value, fallback = {}) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

const payload = parseMaybeJson($json.payload, {});
return [{
  ...payload,
  notes: [
    ...(payload.notes || []),
    "subworkflow___ACTION___input_normalized"
  ]
}];
'@.Replace("___ACTION___", $action)

  $normalize = New-Node -Name "normalize_input" -Type "n8n-nodes-base.code" -Parameters @{
    jsCode = $normalizeJs
  } -Pos @(480, 360)

  $actionNode = [ordered]@{
    parameters = @{
      jsCode = $codeNode.parameters.jsCode
    }
    id = ([guid]::NewGuid().ToString())
    name = $action
    type = "n8n-nodes-base.code"
    typeVersion = 2
    position = @(
      700,
      360
    )
  }

  $wf = [ordered]@{
    name = $wfName
    nodes = @($trigger, $normalize, $actionNode)
    connections = @{
      $wfName = @{ main = @(@(@{ node = "normalize_input"; type = "main"; index = 0 })) }
      normalize_input = @{ main = @(@(@{ node = $action; type = "main"; index = 0 })) }
    }
    settings = @{}
    active = $false
  }

  $fileName = ("{0} - {1}.template.json" -f $number, $action)
  $outPath = Join-Path $OutDir $fileName
  ($wf | ConvertTo-Json -Depth 60) | Set-Content -Encoding UTF8 -Path $outPath
  $count++
}

Write-Host ("OK: generadas {0} plantillas en {1}" -f $count, $OutDir)
