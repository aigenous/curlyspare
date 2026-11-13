#!/usr/bin/env bash
# Fail when a production dist leaks an HTML comment.
# HTML may contain only Vue's empty comment and the two SSR fragment markers.
# JS fails only when '<!--' is followed by whitespace. Vendor copies of marked
# and Vue use '<!--' before '(' or a quote, and those are allowed.
# Usage: scripts/check-dist-html-comments.sh dist
#        scripts/check-dist-html-comments.sh --self-test
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

scan() {
  node --input-type=module - "$1" <<'JS'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dist = process.argv[2]
const allowed = ['<!---->', '<!--[-->', '<!--]-->']
const errors = []
const counts = { empty: 0, open: 0, close: 0 }

function walk(dir, accept, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, accept, out)
    else if (accept(name)) out.push(path)
  }
  return out
}

for (const file of walk(dist, (name) => name.endsWith('.html'))) {
  const text = readFileSync(file, 'utf8')
  let from = 0
  while (from < text.length) {
    const at = text.indexOf('<!--', from)
    if (at < 0) break
    if (text.startsWith('<!--[-->', at)) counts.open += 1
    else if (text.startsWith('<!--]-->', at)) counts.close += 1
    else if (text.startsWith('<!---->', at) && text[at + 7] !== '-') counts.empty += 1
    else errors.push(`${file}: ${JSON.stringify(text.slice(at, at + 48))}`)
    from = at + 4
  }
}

for (const file of walk(join(dist, 'assets'), (name) => name.endsWith('.js'))) {
  const text = readFileSync(file, 'utf8')
  if (/<!--\s/.test(text)) errors.push(`${file}: <!-- followed by whitespace`)
}

console.log(`html markers: <!----> ${counts.empty}, <!--[--> ${counts.open}, <!--]--> ${counts.close}`)
if (errors.length > 0) {
  console.error(errors.join('\n'))
  console.error(`FAIL: ${errors.length} comment leak(s)`)
  process.exit(1)
}
console.log('PASS: dist comments are only Vue markers')
JS
}

if [[ "${1:-}" == "--self-test" ]]; then
  work="$(mktemp -d)"
  trap 'rm -rf "$work"' EXIT
  mkdir -p "$work/app"
  tar -C "$root" --exclude node_modules --exclude dist --exclude .git -cf - . | tar -C "$work/app" -xf -
  ln -s "$root/node_modules" "$work/app/node_modules"
  printf '\n<!-- CS-LEAK-SENTINEL -->\n<!-- [TEST-KOMENTARZ] -->\n' >> "$work/app/src/content/legal/regulamin.md"
  (cd "$work/app" && pnpm build)
  if grep -R -F -e 'CS-LEAK-SENTINEL' -e 'TEST-KOMENTARZ' "$work/app/dist" --include='*.html' --include='*.js'; then
    echo 'FAIL: planted legal comment survived the build'
    exit 1
  fi
  scan "$work/app/dist"
  echo 'ok: planted legal comment is stripped and the built dist passes'

  js_copy="$(mktemp -d)"
  cp -a "$work/app/dist" "$js_copy/dist"
  js_file="$(find "$js_copy/dist/assets" -name '*.js' -print -quit)"
  printf '\n<!-- CS-LEAK-SENTINEL -->\n' >> "$js_file"
  if scan "$js_copy/dist"; then
    echo 'FAIL: injecting the sentinel into JS should fail'
    exit 1
  fi
  echo 'ok: sentinel injected into JS fails'

  html_copy="$(mktemp -d)"
  cp -a "$work/app/dist" "$html_copy/dist"
  html_file="$(find "$html_copy/dist" -name '*.html' -print -quit)"
  printf '\n<!-- leaked comment -->\n' >> "$html_file"
  if scan "$html_copy/dist"; then
    echo 'FAIL: injecting an HTML comment should fail'
    exit 1
  fi
  echo 'ok: HTML comment injection fails'
  echo 'PASS: comment check self-test'
  exit 0
fi

dist="${1:-dist}"
scan "$dist"
