Param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Path $PSScriptRoot -Parent
Set-Location $repoRoot

$files = @(
  "src/screens/HomeScreen.tsx",
  "src/screens/PlayerScreen.tsx",
  "src/utils/supabase.ts"
)

$subject = "feat(player, home): improve playback UX, navigation, and progress"
$body = @"
HomeScreen: fix import path for RootStackParamList
PlayerScreen: UI improvements
Supabase: unchanged
"@

if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Error "Not a git repository. Run this from inside the repo root: $repoRoot"
    exit 1
}

Write-Output "Staging files..."
foreach ($f in $files) {
    if (Test-Path $f) {
        git add $f
    } else {
        Write-Warning "File not found: $f"
    }
}

Write-Output "Committing..."
try {
    git commit -m $subject -m $body
} catch {
    Write-Warning "Nothing to commit or commit failed."
    exit 1
}

Write-Output "Pushing to origin (current branch)..."
git push

Write-Output "Done."
