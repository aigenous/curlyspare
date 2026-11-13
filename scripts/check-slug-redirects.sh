#!/usr/bin/env bash
# Usage: scripts/check-slug-redirects.sh <base-url>
# Requests every vercel.json redirect without following it.
# Requires HTTP 301 and a Location path equal to the destination.
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: scripts/check-slug-redirects.sh <base-url>" >&2
  exit 2
fi

base="${1%/}"
if [[ ! "$base" =~ ^https?://[^[:space:]]+$ ]]; then
  echo "base URL must start with http:// or https://" >&2
  exit 2
fi

root="$(cd "$(dirname "$0")/.." && pwd)"

list="$(node --input-type=module -e '
import { readFileSync } from "node:fs"
const config = JSON.parse(readFileSync(process.argv[1], "utf8"))
if (!Array.isArray(config.redirects) || config.redirects.length === 0) {
  console.error("vercel.json has no redirects")
  process.exit(1)
}
for (const item of config.redirects) {
  if (item.statusCode !== 301 || Object.prototype.hasOwnProperty.call(item, "permanent")) {
    console.error(`redirect ${item.source} must use statusCode 301 and no permanent flag`)
    process.exit(1)
  }
  if (typeof item.source !== "string" || !item.source.startsWith("/")) {
    console.error("redirect source must be an absolute path")
    process.exit(1)
  }
  if (typeof item.destination !== "string" || !item.destination.startsWith("/")) {
    console.error("redirect destination must be an absolute path")
    process.exit(1)
  }
  process.stdout.write(`${item.source}\t${item.destination}\n`)
}
' "$root/vercel.json")" || exit 1

location_path() {
  local loc="$1"
  loc="${loc%%\?*}"
  loc="${loc%%#*}"
  if [[ "$loc" == http://* || "$loc" == https://* ]]; then
    loc="${loc#*://}"
    loc="/${loc#*/}"
  fi
  printf '%s' "$loc"
}

count=0
failures=0
while IFS=$'\t' read -r source destination; do
  [ -n "$source" ] || continue
  count=$((count + 1))
  url="${base}${source}"
  headers="$(curl -sS --http1.1 --max-redirs 0 --max-time 30 -D - -o /dev/null "$url")" || {
    echo "FAIL: curl error for ${url}" >&2
    failures=$((failures + 1))
    continue
  }
  status="$(printf '%s\n' "$headers" | awk '/^HTTP\// { code = $2 } END { print code }')"
  location="$(printf '%s\n' "$headers" | awk 'BEGIN { IGNORECASE = 1 } /^Location:/ { sub(/^[Ll]ocation:[[:space:]]*/, ""); sub(/\r$/, ""); print; exit }')"
  path="$(location_path "$location")"
  if [ "$status" = "301" ] && [ "$path" = "$destination" ]; then
    echo "ok 301 ${source} -> ${destination}"
  else
    echo "FAIL: ${url} status=${status:-<none>} location=${location:-<none>} want 301 ${destination}" >&2
    failures=$((failures + 1))
  fi
done <<<"$list"

if [ "$count" -eq 0 ]; then
  echo "FAIL: no redirects to check" >&2
  exit 1
fi

if [ "$failures" -gt 0 ]; then
  echo "FAIL: ${failures} of ${count} redirects" >&2
  exit 1
fi

echo "PASS: ${count} redirects returned 301"
