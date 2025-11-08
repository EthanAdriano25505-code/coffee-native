param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)

# get current branch (trim newline)
$branch = (git rev-parse --abbrev-ref HEAD) -replace '\r|\n',''

# Write commit message to a secure temp file so special characters don't break the shell/git invocation
$tempFile = Join-Path $env:TEMP ("commitmsg-{0}.txt" -f ([Guid]::NewGuid().ToString()))
Set-Content -Path $tempFile -Value $Message -NoNewline

try {
  & git add -A
  if ($LASTEXITCODE -ne 0) { throw "git add failed (exit code $LASTEXITCODE)" }

  & git commit --file $tempFile
  if ($LASTEXITCODE -ne 0) { throw "git commit failed (exit code $LASTEXITCODE)" }

  & git push origin $branch
  if ($LASTEXITCODE -ne 0) { throw "git push failed (exit code $LASTEXITCODE)" }

  Write-Host "Committed and pushed to $branch"
} catch {
  Write-Error "Error while running git command: $_"
  if (Test-Path $tempFile) { Remove-Item -Force $tempFile -ErrorAction SilentlyContinue }
  exit 1
} finally {
  if (Test-Path $tempFile) { Remove-Item -Force $tempFile -ErrorAction SilentlyContinue }
}
