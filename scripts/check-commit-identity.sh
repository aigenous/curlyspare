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
#
# Trailers are read only from the final paragraph, using git's trailer-block
# rules: every line is a trailer, or the paragraph contains a known trailer and
# at least a quarter of its lines are trailers. The subject paragraph is never
# a trailer block. A conventional-commit subject (for example "ops: pin Node")
# is a pull-request title, not a trailer; git's %(trailers) otherwise treats
# that single line as one.
#
# COMMIT_IDENTITY_ALLOWLIST_EXTRA is a space-separated list of full SHAs used
# by the self-test. CI does not set it.
set -euo pipefail

ALLOWED_AUTHORS=(
  "Cursor Agent <cursoragent@cursor.com>"
  "Piotr Szewczyk <pszewczykpl@gmail.com>"
)
ALLOWED_COMMITTER="Piotr Szewczyk <pszewczykpl@gmail.com>"
GITHUB_COMMITTER="GitHub <noreply@github.com>"
# GitHub web-flow commits already on main. Exact full SHAs; new commits are not added here.
ALLOWED_MERGE_SHAS=(
  "0275b8bb8a5408d316221bdbd5cd428cb63e7c42"
  "17c27f447da822b66970377a45f5a3cafce40510"
  "2a90bf25ea4061ea7ae98a6997c67e61417522a7"
  "4a5cde78cb9850391e87a02dca6df0ae26e7ea29"
  "6d332e0be7a37dff7af0d0931d2f71d512e7cca2"
  "74556b843f1fdc005861e408d3eebe2890952c67"
  "75bef814dc0d72a83d46035f45ca0aeda6bf5e4a"
  "8a83e9a068d1072f9517a1fbeac7c7423c3d507a"
  "8bcee21a75957e70205506d6e68846dfbfe547c3"
  "beb70600a78c49b37aea555ef0b3a45114aa19e2"
  "ddbf8c9fcb39d1db2e49c70d9736eb96c94058b6"
  "e307a86a9a9c267b8399abda2d04a59c88f45dd8"
  "fb086768a0a25520c445fd2899fdfffdaa4ea30a"
)
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

is_allowlisted() {
  local sha="$1" item
  for item in "${ALLOWED_MERGE_SHAS[@]}"; do
    [ "$sha" = "$item" ] && return 0
  done
  if [ -n "${COMMIT_IDENTITY_ALLOWLIST_EXTRA:-}" ]; then
    for item in ${COMMIT_IDENTITY_ALLOWLIST_EXTRA}; do
      [ "$sha" = "$item" ] && return 0
    done
  fi
  return 1
}

is_known_trailer() {
  printf '%s\n' "$1" | grep -Eiq "$KNOWN_TRAILER_RE"
}

is_pr_title() {
  # type, optional (scope), optional bang, then ": description".
  local re='^[a-z][a-z0-9]*(\([^)]+\))?!?:[[:space:]]+[^[:space:]]'
  [[ "$1" =~ $re ]]
}

is_trailer_shaped() {
  local re='^[A-Za-z0-9-]+([[:space:]]+[A-Za-z0-9-]+)?[[:space:]]*:'
  [[ "$1" =~ $re ]]
}

# Print the trailer lines of a commit message, or nothing when the final
# paragraph is not a trailer block.
message_trailers() {
  local msg="$1"
  local -a lines=()
  local line current=""
  local -a paragraphs=()
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ "$line" == "---" || "$line" =~ ^---[[:space:]] ]]; then
      break
    fi
    lines+=("$line")
  done <<< "$msg"

  for line in "${lines[@]}"; do
    if [[ "$line" =~ ^[[:space:]]*$ ]]; then
      if [ -n "$current" ]; then
        paragraphs+=("$current")
        current=""
      fi
    else
      current+="$line"$'\n'
    fi
  done
  if [ -n "$current" ]; then
    paragraphs+=("$current")
  fi
  # The first paragraph is the subject and cannot be a trailer block.
  if [ "${#paragraphs[@]}" -lt 2 ]; then
    return 0
  fi

  local final="${paragraphs[${#paragraphs[@]}-1]}"
  local trailer_lines=0 non_trailer_lines=0 recognized=0 state="start"
  local -a found=()
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    if [[ "$line" =~ ^[[:space:]] ]]; then
      if [ "$state" != "trailer" ]; then
        non_trailer_lines=$((non_trailer_lines + 1))
        state="non"
      fi
      continue
    fi
    if is_known_trailer "$line"; then
      trailer_lines=$((trailer_lines + 1))
      recognized=1
      state="trailer"
      found+=("$line")
      continue
    fi
    if is_pr_title "$line"; then
      non_trailer_lines=$((non_trailer_lines + 1))
      state="non"
      continue
    fi
    if is_trailer_shaped "$line"; then
      trailer_lines=$((trailer_lines + 1))
      state="trailer"
      found+=("$line")
      continue
    fi
    non_trailer_lines=$((non_trailer_lines + 1))
    state="non"
  done <<< "$final"

  if [ "$recognized" -eq 1 ] && [ $((trailer_lines * 3)) -ge "$non_trailer_lines" ]; then
    printf '%s\n' "${found[@]}"
  elif [ "$trailer_lines" -gt 0 ] && [ "$non_trailer_lines" -eq 0 ]; then
    printf '%s\n' "${found[@]}"
  fi
  return 0
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
  if is_allowlisted "$sha"; then
    echo "skip ${short}: allowlisted historical commit"
    continue
  fi

  author="$(git log -1 --format='%an <%ae>' "$sha")"
  committer="$(git log -1 --format='%cn <%ce>' "$sha")"
  parents="$(git log -1 --format='%p' "$sha" | wc -w | tr -d '[:space:]')"

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

  trailers="$(message_trailers "$(git log -1 --format='%B' "$sha")")"
  if [ -n "$trailers" ]; then
    fail "${short}: commit message has trailers: $(echo "$trailers" | tr '\n' ' ')"
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
