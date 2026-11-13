#!/usr/bin/env bash
# Usage:
#   scripts/check-dist-example-hosts.sh [dist]
#   scripts/check-dist-example-hosts.sh --self-test
# Fails if any file contains an .example host, for example name.example.
set -u

pattern='[a-z0-9-]+\.example\b'

scan() {
  local dir="$1"
  local status
  if [ ! -d "$dir" ]; then
    echo "FAIL: not a directory: $dir" >&2
    return 1
  fi
  grep -rEnI -e "$pattern" "$dir"
  status=$?
  if [ "$status" -eq 0 ]; then
    echo "FAIL: .example host in $dir" >&2
    return 1
  fi
  if [ "$status" -ne 1 ]; then
    echo "FAIL: could not scan $dir (grep exit $status)" >&2
    return 1
  fi
  echo "PASS: no .example hosts in $dir"
  return 0
}

self_test() {
  local tmp planted clean output status
  tmp="$(mktemp -d)"
  planted="$tmp/planted"
  clean="$tmp/clean"
  mkdir -p "$planted" "$clean"
  printf '%s\n' 'https://planted.example/qr' > "$planted/page.html"
  printf '%s\n' 'Przykładowy tekst do kodu QR' > "$clean/page.html"
  printf '%s\n' 'https://curlyspare.vercel.app/generator-qr' > "$clean/site.html"
  printf '%s\n' 'https://example.com/not-a-dot-example-tld' > "$clean/example-com.html"
  printf '%s\n' 'page.examples' > "$clean/examples.txt"

  output="$(scan "$planted" 2>&1)"
  status=$?
  printf '%s\n' "$output"
  if [ "$status" -eq 0 ]; then
    echo "FAIL: self-test planted .example host was accepted" >&2
    rm -rf "$tmp"
    return 1
  fi
  echo "ok: planted .example host was rejected"

  if ! scan "$clean"; then
    echo "FAIL: self-test clean directory was rejected" >&2
    rm -rf "$tmp"
    return 1
  fi
  rm -rf "$tmp"
  echo "ok: self-test passed"
  return 0
}

if [ "${1:-}" = "--self-test" ]; then
  self_test
  exit $?
fi

scan "${1:-dist}"
exit $?
