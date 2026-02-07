# Push Sim2Me to https://github.com/gavriel-kr/sim2me
# Run this in PowerShell from the project folder (c:\sim2me), or in Git Bash:
#   cd /c/sim2me && git init && git add . && git commit -m "Initial commit: Sim2Me eSIM" && git branch -M main && git remote add origin https://github.com/gavriel-kr/sim2me.git && git push -u origin main

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Find Git (current session may not have PATH updated after install)
$gitExe = $null
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitExe = "git"
} else {
    $gitPaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files\Git\cmd\git.exe",
        "${env:ProgramFiles(x86)}\Git\bin\git.exe"
    )
    foreach ($p in $gitPaths) {
        if (Test-Path $p) { $gitExe = $p; break }
    }
    if (-not $gitExe) {
        Write-Host "Git not found. Close and reopen the terminal after installing Git, or run in Git Bash:" -ForegroundColor Yellow
        Write-Host "  cd /c/sim2me"
        Write-Host "  git init && git add . && git commit -m `"Initial commit: Sim2Me eSIM`" && git branch -M main && git remote add origin https://github.com/gavriel-kr/sim2me.git && git push -u origin main"
        exit 1
    }
}
function Run-Git { & $gitExe @args }

if (-not (Test-Path .git)) {
    Run-Git init
}
# Always set author for this repo so commit never fails with "Author identity unknown"
# (Git may not be on PATH in this terminal, so global config might not exist)
Run-Git config user.name "Gabriel Kreskas"
Run-Git config user.email "gavriel.kr@gmail.com"
Run-Git add .
Run-Git status
$hasCommit = Run-Git rev-parse HEAD 2>$null
$msg = if ($hasCommit) { "Update: FAQ fix and Airalo design" } else { "Initial commit: Sim2Me eSIM" }
$ErrorActionPreference = "Continue"
Run-Git commit -m $msg
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No new commit (working tree clean or commit failed). Pushing existing commits..." -ForegroundColor Gray
}
Run-Git branch -M main
# Don't stop when "origin" doesn't exist yet (get-url exits 1 and writes to stderr)
$ErrorActionPreference = "Continue"
$rem = Run-Git remote get-url origin 2>$null
$ErrorActionPreference = "Stop"
if (-not $rem) {
    Run-Git remote add origin https://github.com/gavriel-kr/sim2me.git
} elseif ($rem -ne "https://github.com/gavriel-kr/sim2me.git") {
    Run-Git remote set-url origin https://github.com/gavriel-kr/sim2me.git
}
Run-Git push -u origin main
Write-Host "Done. Repo: https://github.com/gavriel-kr/sim2me" -ForegroundColor Green
