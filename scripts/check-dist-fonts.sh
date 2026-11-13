#!/usr/bin/env bash
# Usage: scripts/check-dist-fonts.sh [dist]
# Fails if the build loads fonts/CSS/JS from a third-party host.
# With REQUIRE_DESIGN_FONTS=1 it also fails unless the three design fonts are bundled as /assets/*.woff2.
set -u
D="${1:-dist}"
fail=0

if [ ! -d "$D" ]; then
  echo "FAIL: dist directory not found: $D"
  exit 1
fi
if [ ! -d "$D/assets" ]; then
  echo "FAIL: assets directory not found: $D/assets"
  exit 1
fi

if grep -rEnoI 'fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com' "$D"; then echo "FAIL: third-party font/CDN host"; fail=1; fi
if grep -rEnoI '<link[^>]*rel="?(stylesheet|preconnect|preload|dns-prefetch|modulepreload)"?[^>]*href="(https?:)?//[^"]*"|<link[^>]*href="(https?:)?//[^"]*"[^>]*rel="?(stylesheet|preconnect|preload|dns-prefetch|modulepreload)|<script[^>]*src="(https?:)?//[^"]*"' "$D" --include='*.html'; then echo "FAIL: external stylesheet/preconnect/script in HTML"; fail=1; fi
if grep -rEnoI '@import[^;]*(https?:)?//[^;]*|url\(["'"'"']?(https?:)?//[^)]*\)' "$D" --include='*.css'; then echo "FAIL: external @import/url() in CSS"; fail=1; fi
n=$(find "$D/assets" -name '*.woff2' | wc -l | tr -d '[:space:]')
n=${n:-0}
echo "woff2 files in $D/assets: $n"
if [ "$n" -eq 0 ]; then
  echo "FAIL: no .woff2 files in $D/assets"
  fail=1
fi
if [ "${REQUIRE_DESIGN_FONTS:-0}" = "1" ]; then
  for f in 'Poltawski Nowy' 'Atkinson Hyperlegible Next' 'Atkinson Hyperlegible Mono'; do
    grep -rEqI "font-family:[\"']?$f[\"']?;[^}]*src:url\(/assets/[^)]+\.woff2\)|src:url\(/assets/[^)]+\.woff2\)[^}]*font-family:[\"']?$f" "$D/assets" --include='*.css' \
      && echo "ok: @font-face $f -> /assets/*.woff2" || { echo "FAIL: no bundled @font-face for $f"; fail=1; }
  done
fi
[ $fail -eq 0 ] && echo "PASS: no third-party font/CDN hosts"
exit $fail
