#!/usr/bin/env bash
# Usage:
#   scripts/check-dist-example-hosts.sh [dist]
#   scripts/check-dist-example-hosts.sh --self-test
# Fails on .example hosts and on any http(s) URL whose host is example.com,
# example.org, example.net, or a subdomain of those, in dist text files.
# Text that is only inside a placeholder="..." attribute is allowed.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$root/scripts/check-dist-example-hosts.mjs" "$@"
