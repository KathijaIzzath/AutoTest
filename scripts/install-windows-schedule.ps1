<#
.SYNOPSIS
  Install a daily Windows Scheduled Task that runs the AutoTest suite detached.

.DESCRIPTION
  Creates task "AutoTest\DailyQA" that runs whether or not an interactive
  RDP/desktop session is connected. The suite keeps going after disconnect;
  stop only with: npm run test:stop  (or End Task in Task Scheduler).

.PARAMETER Time
  Local time for the daily run (24h HH:mm). Default 19:30 (7:30 PM).

.PARAMETER Env
  qa (default) or staging.
#>
param(
  [string]$Time = "19:30",
  [ValidateSet("qa", "staging")]
  [string]$Env = "qa"
)

$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent $PSScriptRoot
$Node = (Get-Command node -ErrorAction Stop).Source
$Launcher = Join-Path $Repo "scripts\run-tests-detached.cjs"
$TaskName = "AutoTest\DailyQA"

# Use detached starter so the scheduled action returns quickly while suite continues.
$Tr = "`"$Node`" `"$Launcher`" start --env=$Env -- --project=chromium"

Write-Host "[schedule] Repo: $Repo"
Write-Host "[schedule] Creating task $TaskName at daily $Time (env=$Env)"

schtasks /Create /TN $TaskName /TR $Tr /SC DAILY /ST $Time /RL LIMITED /F | Out-Null

Write-Host "[schedule] Installed."
Write-Host "[schedule] Query:   schtasks /Query /TN $TaskName /V /FO LIST"
Write-Host "[schedule] Run now: schtasks /Run /TN $TaskName"
Write-Host "[schedule] Remove:  schtasks /Delete /TN $TaskName /F"
Write-Host "[schedule] Stop run: npm run test:stop"
