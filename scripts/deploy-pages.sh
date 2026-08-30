#!/usr/bin/env bash
# Builds the static export and pushes it to gh-pages, in one reliable step.
#
# Written after manually repeating (and twice botching, by dropping
# .nojekyll) this exact sequence by hand across several redeploys. Doing
# it as a real script instead of retyped commands means the failure mode
# can only happen once, not every time someone redeploys.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building static export..."
npm run build:pages

if [ ! -f out/.nojekyll ]; then
  echo "ERROR: out/.nojekyll missing after build -- GitHub Pages would ignore _next/. Aborting." >&2
  exit 1
fi

WORKTREE_DIR="$(mktemp -d)/gh-pages-deploy"
trap 'git worktree remove "$WORKTREE_DIR" --force >/dev/null 2>&1 || true; rm -rf "$WORKTREE_DIR"' EXIT

echo "==> Checking out gh-pages into a temporary worktree..."
git worktree prune
git worktree add "$WORKTREE_DIR" gh-pages

echo "==> Replacing worktree contents with the fresh export..."
find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +
cp -a out/. "$WORKTREE_DIR/"

if [ ! -f "$WORKTREE_DIR/.nojekyll" ]; then
  echo "ERROR: .nojekyll missing from worktree after copy. Aborting before commit." >&2
  exit 1
fi

cd "$WORKTREE_DIR"
git add -A
if git diff --cached --quiet; then
  echo "==> Nothing changed since the last deploy."
  exit 0
fi

git -c user.email="ramadevi.venganti@gmail.com" -c user.name="Rishik Rontala" commit -m "Redeploy static export

$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
git push

echo "==> Deployed: https://rishikrrontala-bot.github.io/habitat-pulse-hero/"
