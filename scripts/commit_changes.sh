#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

FILES=(
  "src/screens/HomeScreen.tsx"
  "src/screens/PlayerScreen.tsx"
  "src/utils/supabase.ts"
)

SUBJECT="feat(player, home): improve playback UX, navigation, and progress"
BODY="HomeScreen: fix import path for RootStackParamList\nPlayerScreen: UI improvements\nSupabase: unchanged"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository. Run this from inside the repo root: $REPO_ROOT"
  exit 1
fi

echo "Staging files..."
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    git add "$f"
  else
    echo "Warning: file not found: $f"
  fi
done

echo "Committing..."
git commit -m "$SUBJECT" -m "$BODY" || {
  echo "Nothing to commit or commit failed."
  exit 1
}

echo "Pushing to origin (current branch)..."
git push

echo "Done."
