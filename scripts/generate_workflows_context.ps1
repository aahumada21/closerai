Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$invPath = "workflows/catalog/workflows.inventory.json"
if (-not (Test-Path $invPath)) {
  throw "No existe inventario: $invPath"
}

$inv = Get-Content -Raw $invPath | ConvertFrom-Json
if (-not $inv) { throw "Inventario vacío: $invPath" }

function Sort-Key($w) {
  $cat = "$($w.category)"
  $flow = "$($w.flow_number)"
  $name = "$($w.name)"
  return "$cat`u0000$flow`u0000$name"
}

$groups = $inv | Sort-Object -Property @{Expression={Sort-Key $_}} | Group-Object -Property category

$out = New-Object System.Collections.Generic.List[string]
$out.Add('# Contexto LIVE - Workflows en n8n (desde inventory)')
$out.Add("")
$out.Add('Generado desde: `workflows/catalog/workflows.inventory.json`')
$out.Add("")
$out.Add('Reglas de clasificacion: `docs/WORKFLOW_TAXONOMY.md`')
$out.Add("")

foreach ($g in $groups) {
  $out.Add("## $($g.Name)")
  $out.Add("")
  $out.Add("| # | Nombre | Tags | Activo | Export |")
  $out.Add("|---:|---|---|:---:|---|")
  foreach ($w in $g.Group) {
    $num = if ($w.flow_number) { "$($w.flow_number)" } else { "" }
    $tags = if ($w.tags) { ($w.tags -join ", ") } else { "" }
    $active = if ($w.active -eq $true) { "yes" } else { "no" }
    $export = "$($w.export_path)"
    $name = ($w.name -replace "\\|","/")
    $out.Add("| $num | $name | $tags | $active | ``$export`` |")
  }
  $out.Add("")
}

$dest = "docs/WORKFLOWS_CONTEXT_LIVE.md"
$out -join "`n" | Set-Content -Encoding UTF8 -Path $dest
Write-Host "OK: generado $dest"
