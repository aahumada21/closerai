param(
  [Parameter(Mandatory = $false)]
  [string]$TemplatesDir = "workflows/modules/action_executor",

  [Parameter(Mandatory = $false)]
  [string]$Category = "uncategorized",

  [Parameter(Mandatory = $false)]
  [string[]]$ExcludeNumbers = @("6.7")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$createScript = Join-Path $PSScriptRoot "n8n_create_workflow_from_template.ps1"
if (-not (Test-Path $createScript)) {
  throw "No existe: $createScript"
}

if (-not (Test-Path $TemplatesDir)) {
  throw "No existe TemplatesDir: $TemplatesDir"
}

$templates = Get-ChildItem -File -Path $TemplatesDir -Filter "*.template.json" | Sort-Object Name
if (-not $templates -or $templates.Count -eq 0) {
  throw "No hay templates en: $TemplatesDir"
}

function Get-NumberPrefix([string]$Name) {
  $m = [regex]::Match($Name, '^\s*(\d+(?:\.\d+)?)\b')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

$excluded = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($n in $ExcludeNumbers) { [void]$excluded.Add("$n") }

$created = 0
$skipped = 0
$failed = 0

foreach ($t in $templates) {
  $num = Get-NumberPrefix $t.BaseName
  if ($num -and $excluded.Contains($num)) {
    Write-Host ("SKIP: {0} ({1})" -f $num, $t.Name)
    $skipped++
    continue
  }

  try {
    & powershell -ExecutionPolicy Bypass -File $createScript -TemplatePath $t.FullName -Category $Category
    $created++
  } catch {
    $numSafe = $num
    if ([string]::IsNullOrWhiteSpace($numSafe)) { $numSafe = "?" }
    Write-Host ("FAIL: {0} ({1})" -f $numSafe, $t.Name)
    Write-Host ("- {0}" -f $_.Exception.Message)
    $failed++
  }
}

Write-Host ("DONE: created={0} skipped={1} failed={2}" -f $created, $skipped, $failed)
