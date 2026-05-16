Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Update-Repo([string]$Path) {
  if (-not (Test-Path $Path)) {
    throw "No existe: $Path"
  }
  Push-Location $Path
  try {
    if (-not (Test-Path ".git")) {
      throw "No es repo git: $Path"
    }
    git fetch --prune --tags
    git pull --ff-only
  }
  finally {
    Pop-Location
  }
}

Update-Repo "skills/n8n/n8n-skills"
Update-Repo "mcp/n8n/n8n-mcp"

Write-Host "OK: vendors actualizados."

