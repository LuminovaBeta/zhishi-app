$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot 'www'
New-Item -ItemType Directory -Force -Path $webRoot | Out-Null
$assets = @('index.html','app.js','styles.css','heatmap.css','theme.css','manifest.webmanifest','sw.js','icon.svg','icon-192.png','icon-512.png')
foreach ($asset in $assets) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $asset) -Destination (Join-Path $webRoot $asset) -Force
}
Push-Location $projectRoot
try { npx cap sync android } finally { Pop-Location }
