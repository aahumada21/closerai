param(
  [Parameter(Mandatory = $true)]
  [string]$SqlFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#') -or $line -notmatch '=') { return }
    $parts = $line -split '=', 2
    [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim())
  }
}

function Require-Tool([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$Name' en PATH."
  }
}

function Require-Env([string]$Name) {
  $v = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Falta variable: $Name" }
  return $v.Trim()
}

if (-not (Test-Path $SqlFile)) { throw "No existe SqlFile: $SqlFile" }
Import-DotEnv ".env"
Require-Tool "psql"

$dbUrl = Require-Env "SUPABASE_DB_URL"

Write-Host "Subiendo QA scenario(s) desde: $SqlFile"
& psql $dbUrl -v ON_ERROR_STOP=1 -f $SqlFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "OK: escenarios cargados."
