#!/usr/bin/env bash
# Fail a production build that still publishes the placeholder host.
# Usage: scripts/check-site-url.sh [dist]
#
# VERCEL_ENV=production enforces the check. Previews, local builds, and CI
# leave VERCEL_ENV unset or set to preview/development and only warn.
set -u
D="${1:-dist}"
PLACEHOLDER="devnarzedzia.example"

if [ ! -d "$D" ]; then
  echo "FAIL: dist directory not found: $D"
  exit 1
fi

problems=""
add_problem() {
  problems="${problems}${1}"$'\n'
}

if [ ! -f "$D/sitemap.xml" ]; then
  add_problem "sitemap.xml is missing"
elif grep -q "$PLACEHOLDER" "$D/sitemap.xml"; then
  add_problem "sitemap.xml contains ${PLACEHOLDER}"
fi

html_hits=0
html_example=""
tags=$(grep -rEnoI '<(link|meta)\b[^>]*>' "$D" --include='*.html' || true)
if [ -n "$tags" ]; then
  while IFS= read -r tag; do
    case "$tag" in
      *"$PLACEHOLDER"*)
        if printf '%s\n' "$tag" | grep -Eqi 'rel=["'\'']canonical["'\'']|property=["'\'']og:[^"'\'']*["'\'']'; then
          html_hits=$((html_hits + 1))
          if [ -z "$html_example" ]; then
            html_example="$tag"
          fi
        fi
        ;;
    esac
  done <<< "$tags"
fi
if [ "$html_hits" -gt 0 ]; then
  add_problem "canonical/og URLs in ${html_hits} tag(s); example: ${html_example}"
fi

if [ "${VERCEL_ENV:-}" = "production" ]; then
  if [ -n "$problems" ]; then
    echo "FAIL: production build still references ${PLACEHOLDER}"
    printf '%s' "$problems"
    exit 1
  fi
  echo "PASS: production site URL does not use ${PLACEHOLDER}"
  exit 0
fi

if [ -n "$problems" ]; then
  echo "WARN: ${PLACEHOLDER} is present, but VERCEL_ENV is not production (${VERCEL_ENV:-unset}); not failing the build"
  printf '%s' "$problems"
fi
echo "PASS: site URL check skipped outside production"
exit 0
