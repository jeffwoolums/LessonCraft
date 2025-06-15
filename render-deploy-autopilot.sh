#!/bin/bash

echo "=================================="
echo "🚀 Render Deploy Autopilot Starting"
echo "=================================="

# Verify current branch
branch=$(git branch --show-current)
if [[ "$branch" != "main" ]]; then
  echo "🛑 You are not on the 'main' branch (currently on '$branch')."
  echo "Please switch to 'main' before deploying."
  exit 1
fi

# Check for untracked files
echo "🔎 Checking for untracked files..."
untracked=$(git ls-files --others --exclude-standard)

if [[ -n "$untracked" ]]; then
  echo "🛑 You have untracked files:"
  echo "$untracked"
  echo "Auto-adding untracked files..."
  git add .
else
  echo "✅ No untracked files."
fi

# Stage any modified files
echo "🔎 Checking for modified files..."
modified=$(git status --porcelain)

if [[ -n "$modified" ]]; then
  echo "🛑 You have modified files:"
  echo "$modified"
  echo "Auto-staging modified files..."
  git add .
else
  echo "✅ No modified files."
fi

# Show staged files
echo "📄 Staged files:"
git diff --cached --name-only

# Prompt for commit message
read -p "Enter commit message for Render deploy: " commit_msg

# Commit staged changes
git commit -m "$commit_msg"

# Push to GitHub
git push origin main

# Verify casing (Render is case-sensitive)
echo "🔎 Case sensitivity check:"
git ls-files | grep -i prompt

echo "=================================="
echo "✅ Deploy prep complete. You can now redeploy in Render."
echo "=================================="
