param(
  [string[]]$Paths = @("workflows/exports"),
  [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-TargetFiles([string[]]$InputPaths) {
  $files = New-Object System.Collections.Generic.List[System.IO.FileInfo]
  foreach ($p in $InputPaths) {
    if (-not (Test-Path $p)) { continue }
    $item = Get-Item -Path $p
    if ($item.PSIsContainer) {
      $children = Get-ChildItem -Path $item.FullName -Recurse -File -Filter *.json
      foreach ($c in $children) { [void]$files.Add($c) }
    } elseif ($item.Extension -ieq ".json") {
      [void]$files.Add($item)
    }
  }
  return $files.ToArray()
}

function Fix-Latin1Mojibake([string]$text) {
  if ([string]::IsNullOrEmpty($text)) { return $text }
  if ($text -notmatch "[ÃÂ]") { return $text }
  try {
    $bytes = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetBytes($text)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
  } catch {
    return $text
  }
}

function Fix-Cp437Mojibake([string]$text) {
  if ([string]::IsNullOrEmpty($text)) { return $text }
  $chars = @([char]0x252C, [char]0x251C, [char]0x2524, [char]0x2510, [char]0x2502)
  $hasBoxChar = $false
  foreach ($ch in $chars) {
    if ($text.Contains([string]$ch)) { $hasBoxChar = $true; break }
  }
  if (-not $hasBoxChar) { return $text }
  try {
    $bytes = [System.Text.Encoding]::GetEncoding(437).GetBytes($text)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
  } catch {
    return $text
  }
}

function Apply-Replacements([string]$text, [hashtable]$map) {
  $out = $text
  foreach ($k in $map.Keys) {
    $out = $out.Replace($k, $map[$k])
  }
  return $out
}

$replacementMap = @{
  "ï¿½Quï¿½" = "¿Qué";
  "ï¿½Cuï¿½l" = "¿Cuál";
  "ï¿½Para quï¿½" = "¿Para qué";
  "ï¿½en quï¿½" = "¿en qué";
  "ï¿½me puedes" = "¿me puedes";
  "ï¿½Te gustarï¿½a" = "¿Te gustaría";
  "direcciï¿½n" = "dirección";
  "cotizaciï¿½n" = "cotización";
  "vehï¿½culo" = "vehículo";
  "vehï¿½culos" = "vehículos";
  "opciï¿½n" = "opción";
  "prï¿½ximos" = "próximos";
  "dï¿½a" = "día";
  "dï¿½as" = "días";
  "serï¿½a" = "sería";
  "mï¿½s" = "más";
  "estï¿½" = "está";
  "reseï¿½a" = "reseña";
  "maï¿½ana" = "mañana";
  "nï¿½mero" = "número";
  "Conchalï¿½" = "Conchalí";
  "Peï¿½alolï¿½n" = "Peñalolén";
  "Maipï¿½" = "Maipú";
  "Furgï¿½n" = "Furgón";
  "Sedï¿½n" = "Sedán"
}

$files = @(Get-TargetFiles -InputPaths $Paths)
if ($files.Count -eq 0) {
  Write-Host "No JSON files found to sanitize."
  exit 0
}

$changed = 0
$processed = 0

foreach ($f in $files) {
  $processed++
  $raw = Get-Content -Raw -Encoding UTF8 -Path $f.FullName
  $updated = $raw

  for ($i = 0; $i -lt 4; $i++) {
    $before = $updated
    $updated = Fix-Latin1Mojibake $updated
    $updated = Fix-Cp437Mojibake $updated
    $updated = Apply-Replacements -text $updated -map $replacementMap
    $updated = $updated.Replace([string][char]0xFFFD, "")
    if ($updated -eq $before) { break }
  }

  if ($updated -ne $raw) {
    $changed++
    if (-not $WhatIf) {
      $updated | Set-Content -Encoding UTF8 -Path $f.FullName
    }
    Write-Host ("FIXED: {0}" -f $f.FullName)
  }
}

if ($WhatIf) {
  Write-Host ("WhatIf: {0}/{1} files would be changed." -f $changed, $processed)
} else {
  Write-Host ("DONE: sanitized {0}/{1} files." -f $changed, $processed)
}
