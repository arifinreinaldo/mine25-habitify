#!/bin/bash

# Cloudflare Pages build script
# Skips build if only widget/docs files changed

# Get changed files between current and previous commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

# Check if any web-related files changed
WEB_CHANGED=false
for file in $CHANGED_FILES; do
  # Skip if file is in habitify_widget/ or is a markdown file
  if [[ ! "$file" =~ ^habitify_widget/ ]] && [[ ! "$file" =~ \.md$ ]]; then
    WEB_CHANGED=true
    break
  fi
done

if [ "$WEB_CHANGED" = false ] && [ -n "$CHANGED_FILES" ]; then
  echo "Only widget/docs files changed. Skipping build."
  # Create empty dist to satisfy Cloudflare
  mkdir -p dist
  echo "<html><body>No changes</body></html>" > dist/index.html
  exit 0
fi

echo "Web files changed. Running build..."
npm ci && npm run build
