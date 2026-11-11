#!/usr/bin/env bash
# Self-test for scripts/check-commit-identity.sh using throwaway repositories.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/check-commit-identity.sh"
DOMAIN="digital""virgo.com"
OK_AUTHOR_NAME="Cursor Agent"
OK_AUTHOR_EMAIL="cursoragent@cursor.com"
OK_COMMITTER_NAME="Piotr Szewczyk"
OK_COMMITTER_EMAIL="pszewczykpl@gmail.com"

passed=0
failed=0
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

new_repo() {
  local dir="$WORK/$1"
  mkdir -p "$dir"
  git -C "$dir" init -q -b main
  git -C "$dir" config core.hooksPath /dev/null
  echo "$dir"
}

# make_commit DIR MESSAGE [AUTHOR_NAME AUTHOR_EMAIL COMMITTER_NAME COMMITTER_EMAIL [EXTRA_PARENT]]
make_commit() {
  local dir="$1" msg="$2"
  local an="${3:-$OK_AUTHOR_NAME}" ae="${4:-$OK_AUTHOR_EMAIL}"
  local cn="${5:-$OK_COMMITTER_NAME}" ce="${6:-$OK_COMMITTER_EMAIL}"
  local extra_parent="${7:-}"
  (
    cd "$dir"
    git add -A
    local tree parents=()
    tree="$(git write-tree)"
    if git rev-parse -q --verify HEAD >/dev/null; then parents+=(-p HEAD); fi
    if [ -n "$extra_parent" ]; then parents+=(-p "$extra_parent"); fi
    local sha
    sha="$(printf '%s\n' "$msg" | GIT_AUTHOR_NAME="$an" GIT_AUTHOR_EMAIL="$ae" \
      GIT_COMMITTER_NAME="$cn" GIT_COMMITTER_EMAIL="$ce" git commit-tree "$tree" "${parents[@]}")"
    git update-ref HEAD "$sha"
  )
}

base_repo() {
  local dir
  dir="$(new_repo "$1")"
  echo base > "$dir/README.md"
  make_commit "$dir" "Initial commit"
  git -C "$dir" branch base
  echo "$dir"
}

expect() {
  local want="$1" name="$2" dir="$3"
  local got=0
  (cd "$dir" && GITHUB_ACTIONS='' bash "$SCRIPT" base HEAD >/dev/null 2>&1) || got=1
  if { [ "$want" = pass ] && [ "$got" = 0 ]; } || { [ "$want" = fail ] && [ "$got" = 1 ]; }; then
    passed=$((passed + 1)); echo "ok   - $name"
  else
    failed=$((failed + 1)); echo "FAIL - $name (expected $want)"
  fi
}

d="$(base_repo good)"; echo a > "$d/a.txt"; make_commit "$d" "Add a"
expect pass "compliant commit" "$d"

d="$(base_repo owner-author)"; echo a > "$d/a.txt"; make_commit "$d" "Add a" "Piotr Szewczyk" "pszewczykpl@gmail.com"
expect pass "owner as author" "$d"

d="$(base_repo bad-author)"; echo a > "$d/a.txt"; make_commit "$d" "Add a" "Someone" "someone@example.com"
expect fail "foreign author" "$d"

d="$(base_repo dotted-committer)"; echo a > "$d/a.txt"
make_commit "$d" "Add a" "$OK_AUTHOR_NAME" "$OK_AUTHOR_EMAIL" "Piotr Szewczyk" "p.szewczykpl@gmail.com"
expect fail "committer email with dot" "$d"

d="$(base_repo agent-committer)"; echo a > "$d/a.txt"
make_commit "$d" "Add a" "$OK_AUTHOR_NAME" "$OK_AUTHOR_EMAIL" "$OK_AUTHOR_NAME" "$OK_AUTHOR_EMAIL"
expect fail "agent as committer" "$d"

d="$(base_repo coauthor)"; echo a > "$d/a.txt"
make_commit "$d" "$(printf 'Add a\n\nCo-authored-by: Piotr Szewczyk <pszewczykpl@users.noreply.github.com>')"
expect fail "Co-authored-by trailer" "$d"

d="$(base_repo signoff)"; echo a > "$d/a.txt"
make_commit "$d" "$(printf 'Add a\n\nSigned-off-by: Cursor Agent <cursoragent@cursor.com>')"
expect fail "Signed-off-by trailer" "$d"

d="$(base_repo custom-trailer)"; echo a > "$d/a.txt"
make_commit "$d" "$(printf 'Add a\n\nSome-Key: value')"
expect fail "arbitrary trailer" "$d"

d="$(base_repo body-colon)"; echo a > "$d/a.txt"
make_commit "$d" "$(printf 'Add a\n\nNote: this is prose, not a trailer.\nIt continues here.')"
expect pass "colon in prose body" "$d"

d="$(base_repo domain-email)"; echo a > "$d/a.txt"
make_commit "$d" "Add a" "Cursor Agent" "cursoragent@$DOMAIN"
expect fail "forbidden domain in author email" "$d"

d="$(base_repo domain-msg)"; echo a > "$d/a.txt"
make_commit "$d" "Mention $DOMAIN"
expect fail "forbidden domain in message" "$d"

d="$(base_repo domain-tree)"; echo "contact: x@$DOMAIN" > "$d/a.txt"
make_commit "$d" "Add a"
expect fail "forbidden domain in tree" "$d"

d="$(base_repo domain-removed)"; echo "contact: x@$DOMAIN" > "$d/a.txt"
make_commit "$d" "Add a"; echo clean > "$d/a.txt"; make_commit "$d" "Clean a"
expect fail "forbidden domain added then removed in range" "$d"

d="$(base_repo gh-merge)"
git -C "$d" checkout -q -b topic
echo t > "$d/t.txt"; make_commit "$d" "Topic work"
topic="$(git -C "$d" rev-parse HEAD)"
git -C "$d" checkout -q main
echo m > "$d/m.txt"; make_commit "$d" "Main work"
git -C "$d" merge -q --no-commit --no-ff topic >/dev/null 2>&1 || true
make_commit "$d" "Merge pull request #1" "Piotr Szewczyk" "pszewczykpl@gmail.com" "GitHub" "noreply@github.com" "$topic"
expect pass "GitHub UI merge commit" "$d"

d="$(base_repo gh-nonmerge)"; echo a > "$d/a.txt"
make_commit "$d" "Squashed" "$OK_AUTHOR_NAME" "$OK_AUTHOR_EMAIL" "GitHub" "noreply@github.com"
expect fail "GitHub committer on non-merge commit" "$d"

d="$(base_repo bad-in-base)"
git -C "$d" checkout -q -b tmp
git -C "$d" branch -D base >/dev/null
echo x > "$d/x.txt"; make_commit "$d" "Old bad" "Someone" "someone@example.com"
git -C "$d" branch base
echo a > "$d/a.txt"; make_commit "$d" "Add a"
expect pass "bad commit outside range is ignored" "$d"

echo
echo "check-commit-identity self-test: ${passed} passed, ${failed} failed"
[ "$failed" -eq 0 ]
