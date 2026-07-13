#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

check_contains() {
  local file="$1"
  local pattern="$2"
  if command -v rg >/dev/null 2>&1; then
    rg -q "$pattern" "$file" && return 0
  else
    grep -Eq "$pattern" "$file" && return 0
  fi
  echo "[FAIL] Missing pattern '$pattern' in $file"
  exit 1
}

EDITOR="$ROOT/src/components/admin/markdown-split-editor.tsx"
IMPORTER="$ROOT/src/components/admin/docx-case-study-importer.tsx"
PUBLISHED="$ROOT/src/components/case-study/case-study-template.tsx"

check_contains "$EDITOR" "markdownToHtml\(markdown\)"
check_contains "$EDITOR" "markdown-content"

check_contains "$IMPORTER" "markdownToHtml\(displayGenerated\?\.markdown \|\| state\.generatedMarkdown\)"
check_contains "$IMPORTER" "markdown-content"

check_contains "$PUBLISHED" "markdownToHtml\(section\.content\)"
check_contains "$PUBLISHED" "markdownToHtml\(study\.body\)"
check_contains "$PUBLISHED" "markdown-content"

echo "[PASS] Markdown renderer parity checks passed."
