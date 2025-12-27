#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 \"commit message\""
  exit 1
fi

# determine current branch
branch=$(git rev-parse --abbrev-ref HEAD)

git add -A
git commit -m "$1"
git push origin "$branch"

echo "Committed and pushed to ${branch}"
