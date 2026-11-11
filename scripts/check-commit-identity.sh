#!/usr/bin/env bash
# Verifies commit identity rules for every commit in BASE..HEAD and scans the
# HEAD tree for the forbidden domain.
#
# Usage: scripts/check-commit-identity.sh [BASE] [HEAD]
#   BASE  commit to start from (exclusive). Empty or all-zero => full history of HEAD.
#   HEAD  commit to check up to (inclusive). Defaults to HEAD.
#
# Rules:
#   - author must be one of ALLOWED_AUTHORS
#   - committer must be ALLOWED_COMMITTER; GITHUB_COMMITTER is accepted only
#     for merge commits (more than one parent) created in the GitHub UI
#   - no trailers at all (Co-authored-by, Signed-off-by, ...)
#   - the forbidden domain must not appear in the raw commit object, in added
#     lines of the commit's diff, or anywhere in the HEAD tree
set -euo pipefail

ALLOWED_AUTHORS=(
  "Cursor Agent <cursoragent@cursor.com>"
  "Piotr Szewczyk <pszewczykpl@gmail.com>"
)
ALLOWED_COMMITTER="Piotr Szewczyk <pszewczykpl@gmail.com>"
GITHUB_COMMITTER="GitHub <noreply@github.com>"
# Split so this file never contains the literal it searches for.
FORBIDDEN_DOMAIN_RE="digital""virgo\\.com"
KNOWN_TRAILER_RE='^[[:space:]]*(co-authored-by|signed-off-by|reviewed-by|acked-by|tested-by|reported-by|suggested-by|helped-by|cc|change-id|made-with|generated-by)[[:space:]]*:'

BASE="${1:-}"
HEAD_REF="${2:-HEAD}"

errors=0
fail() {
  errors=$((errors + 1))
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "::error title=commit identity::$*"
  else
    echo "ERROR: $*" >&2
  fi
}

is_allowed_author() {
  local who="$1" a
  for a in "${ALLOWED_AUTHORS[@]}"; do
    [ "$who" = "$a" ] && return 0
  done
  return 1
}

HEAD_SHA="$(git rev-parse --verify "${HEAD_REF}^{commit}")"

if [ -z "$BASE" ] || [[ "$BASE" =~ ^0+$ ]]; then
  range=("$HEAD_SHA")
  echo "Checking full history of ${HEAD_SHA}"
elif ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  echo "Base ${BASE} not found locally (force push?); checking full history of ${HEAD_SHA}"
  range=("$HEAD_SHA")
else
  BASE_SHA="$(git rev-parse --verify "${BASE}^{commit}")"
  range=("${BASE_SHA}..${HEAD_SHA}")
  echo "Checking commits ${BASE_SHA}..${HEAD_SHA}"
fi

commits="$(git rev-list "${range[@]}")"
count=0
for sha in $commits; do
  count=$((count + 1))
  short="${sha:0:12}"
  author="$(git log -1 --format='%an <%ae>' "$sha")"
  committer="$(git log -1 --format='%cn <%ce>' "$sha")"
  parents="$(git log -1 --format='%p' "$sha" | wc -w)"

  if ! is_allowed_author "$author"; then
    fail "${short}: author '${author}' is not allowed"
  fi

  if [ "$committer" != "$ALLOWED_COMMITTER" ]; then
    if [ "$committer" = "$GITHUB_COMMITTER" ] && [ "$parents" -gt 1 ]; then
      :
    elif [ "$committer" = "$GITHUB_COMMITTER" ]; then
      fail "${short}: committer '${committer}' is only allowed for merge commits"
    else
      fail "${short}: committer '${committer}' is not allowed"
    fi
  fi

  trailers="$(git log -1 --format='%(trailers:unfold)' "$sha" | sed '/^[[:space:]]*$/d')"
  if [ -n "$trailers" ]; then
    fail "${short}: commit message has trailers: $(echo "$trailers" | tr '\n' ' ')"
  elif git log -1 --format='%B' "$sha" | grep -Eiq "$KNOWN_TRAILER_RE"; then
    fail "${short}: commit message contains a trailer-like line: $(git log -1 --format='%B' "$sha" | grep -Ei "$KNOWN_TRAILER_RE" | head -1)"
  fi

  if git cat-file commit "$sha" | grep -Eiq "$FORBIDDEN_DOMAIN_RE"; then
    fail "${short}: commit metadata or message contains the forbidden domain"
  fi

  if [ "$parents" -le 1 ] && git show --format= --no-color --unified=0 "$sha" \
      | grep -E '^\+' | grep -Ev '^\+\+\+ ' | grep -Eiq "$FORBIDDEN_DOMAIN_RE"; then
    fail "${short}: diff adds the forbidden domain"
  fi
done

echo "Checked ${count} commit(s)."

tree_hits="$(git grep -I -l -i -E "$FORBIDDEN_DOMAIN_RE" "$HEAD_SHA" -- . || true)"
if [ -n "$tree_hits" ]; then
  while IFS= read -r hit; do
    fail "forbidden domain found in tree: ${hit#"${HEAD_SHA}":}"
  done <<< "$tree_hits"
fi

if [ "$errors" -gt 0 ]; then
  echo "Commit identity check FAILED with ${errors} error(s)." >&2
  exit 1
fi
echo "Commit identity check passed."
