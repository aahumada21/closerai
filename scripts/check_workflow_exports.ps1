param(
  # Default: only check versionable workflow JSONs (exports/modules).
  [string[]]$Roots = @("workflows/exports", "workflows/modules"),
  # Optional: check only these files (overrides Roots).
  [string[]]$Paths = @(),
  [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
  if ($VerboseOutput) { Write-Host $msg }
}

function Get-JsonFiles([string]$path) {
  if (-not (Test-Path $path)) { return @() }
  return Get-ChildItem -Path $path -Recurse -File -Filter *.json
}

function Find-ReplacementChar([string]$text) {
  if ($null -eq $text) { return $false }
  return $text.Contains([char]0xFFFD) -or $text.Contains("�")
}

function Find-MojibakePattern([string]$text) {
  if ($null -eq $text) { return $false }
  if ($text -match "Ã.|Â.") { return $true }
  if ($text -match "�") { return $true }
  return $false
}

$files = @()
if ($Paths -and $Paths.Count -gt 0) {
  foreach ($p in $Paths) {
    if (-not (Test-Path $p)) {
      $hasErrors = $true
      $issues = New-Object System.Collections.Generic.List[string]
      $issues.Add(("MISSING_PATH: {0}" -f $p))
      Write-Host "FAIL: workflow exports check failed."
      $issues | ForEach-Object { Write-Host ("- " + $_) }
      exit 1
    }
    $item = Get-Item -Path $p
    if ($item.PSIsContainer) {
      $files += Get-JsonFiles $item.FullName
    } else {
      $files += $item
    }
  }
} else {
  foreach ($r in $Roots) { $files += Get-JsonFiles $r }
}
if ($files.Count -eq 0) {
  Write-Host ("No JSON files found under: {0}" -f ($Roots -join ", "))
  exit 0
}

$hasErrors = $false
$issues = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  # Skip non-workflow artifacts if they appear in roots
  if ($f.Name -eq "last_update_error.json") { continue }

  $raw = Get-Content -Raw -Encoding UTF8 -Path $f.FullName

  try {
    $wf = $raw | ConvertFrom-Json
  } catch {
    $hasErrors = $true
    $issues.Add(("JSON_INVALID: {0} :: {1}" -f $f.FullName, $_.Exception.Message))
    continue
  }

  # Ignore archived workflows (n8n won't accept PUT updates for them).
  if ($wf -and $wf.PSObject.Properties.Match('isArchived').Count -gt 0 -and $wf.isArchived -eq $true) { continue }

  # Check for replacement char / mojibake patterns in top-level raw as a first pass
  if ((Find-ReplacementChar $raw) -or (Find-MojibakePattern $raw)) {
    # Narrow down to jsCode / message strings if possible
    $jsNodes = @()
    if ($wf.nodes) {
      $jsNodes = $wf.nodes | Where-Object { $_.parameters -and $_.parameters.jsCode }
    }

    if ($jsNodes.Count -eq 0) {
      $hasErrors = $true
      $issues.Add(("MOJIBAKE_PATTERN: {0} :: found mojibake pattern but no jsCode nodes detected" -f $f.FullName))
    } else {
      foreach ($n in $jsNodes) {
        $js = $n.parameters.jsCode
        if ((Find-ReplacementChar $js) -or (Find-MojibakePattern $js)) {
          $hasErrors = $true
          $issues.Add(("MOJIBAKE_PATTERN: {0} :: node='{1}'" -f $f.FullName, $n.name))
        }
      }
    }
  }
}

if ($hasErrors) {
  Write-Host "FAIL: workflow exports check failed."
  $issues | ForEach-Object { Write-Host ("- " + $_) }
  Write-Host ""
  Write-Host "Fix tips:"
  Write-Host "- Re-export/write files as UTF-8 (PowerShell: Set-Content -Encoding UTF8)."
  Write-Host "- Run sanitizer: powershell -ExecutionPolicy Bypass -File scripts/fix_mojibake_workflow_exports.ps1 -Paths ""workflows/exports"""
  Write-Host "- Avoid mixed encodings in Code node message strings."
  exit 1
}

Write-Host ("OK: checked {0} JSON files (no invalid JSON / no mojibake patterns in jsCode)." -f $files.Count)
