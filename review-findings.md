# CurlySpare logic review

Reviewed at 2026-11-11 21:44 UTC, before the 23:05 Europe/Warsaw freeze. Heads were not re-fetched after that. Do not post this file to GitHub from here; it is the ready-to-paste review text.

## Blockers for tonight's preview

None. Nothing in `src/lib` must be held off `main` for a wrong checksum, `Math.random` used for a secret, `eval` / unsanitised HTML, or a GPL / AGPL / LGPL dependency.

| Check | Result |
| --- | --- |
| PESEL century month + checksum | Matches the published vector `44051401359` and the leap-year vector `00222900009`. `00022900003` (29 Feb 1900) is rejected. |
| NIP weights 6,5,7,2,3,4,5,6,7 and mod 11 == 10 | `5260250274` and `1234563218` accepted. A body whose remainder is 10 cannot be completed. |
| REGON 9 and 14 | Weights `8,9,2,3,4,5,6,7` and `2,4,8,5,0,9,7,3,6,1,2,4,8`. Remainder 10 is stored as 0. The 14-digit form also checks the embedded 9-digit number. |
| IBAN / NRB mod 97 | Chunked remainder, not a float. `PL61109010140000071219812874` and the Ministry example both come out to 1. Only `PL` / 28 characters is accepted, which the UI already says. |
| Passwords, UUID, generator draws | `crypto.getRandomValues` with rejection sampling. No `Math.random` under `src`. |
| Markdown | `marked` output goes through DOMPurify. The unit test strips `<script>`, `onerror`, and `javascript:`. Entity decode is written into a textarea, not `v-html`. |
| JWT | `signatureVerified` is the literal `false`. `alg: none` is still reported as not verified. |
| YAML tags | `!!python/object/apply:os.system` is kept as text. No tag is executed. |
| Licences | Direct dependencies plus 263 transitive packages on the scaffold install: no GPL, AGPL, or LGPL. |

## Fix that matters for the preview

**PR #3, major. JSON, YAML, and CSV silently round integers past 2^53.**

`src/lib/converters/json.ts` around the old lines 202–207, and `src/lib/converters/yaml.ts` around the old lines 266–268, parse a numeric lexeme with `JSON.parse` and then `JSON.stringify` it back. `9007199254740993` was written out as `9007199254740992`. The same value in YAML became `9007199254740992`. CSV export of that JSON inherited the rounded number.

Suggested fix, which is what `review/converters-fixes` does: when the lexeme is an integer and `Number.isSafeInteger` is false, keep it as `BigInt` and emit the decimal digits with no quotes. `9007199254740991` (`Number.MAX_SAFE_INTEGER`) and ordinary decimals stay ordinary numbers. Custom YAML tags stay inert strings.

Ready to paste on PR #3:

> **Major — `src/lib/converters/json.ts:202` and `src/lib/converters/yaml.ts:266`.** Formatting `9007199254740993` returns `9007199254740992`. Both parsers run the lexeme through `JSON.parse`, which cannot represent integers above `2^53 - 1`, and the formatters stringify that rounded `number`. CSV export of the same JSON repeats the rounded value. Keep an all-digit lexeme that fails `Number.isSafeInteger` as a `BigInt` and write it back with `toString()`, so the digits do not change. `9007199254740991` and `1.5` can stay numbers.

## PRs and heads at review time

| PR | Branch | Base | Head SHA | `src/lib` |
| --- | --- | --- | --- | --- |
| #1 | `feat/scaffold` | `main` | `f081ea0599566a64ddcab362123e7fd8689e44e9` | `src/lib/misc`, `src/lib/search.ts` |
| #2 | `feat/ci-tests` | `feat/scaffold` @ `85f3e44` | `fc24c8c43b555cf55fc96502755259656fa9b983` | No new logic. CI, licence script, extra tests. |
| #3 | `feat/converters` | `feat/scaffold` @ `f081ea0` | `a54749b4ec7c432986d472437f1103f399617fff` | `src/lib/converters` |
| #4 | `feat/generators` | `feat/scaffold` @ `85f3e44` | `4add390cd150472c8e770b9f085323ba573f157f` | `src/lib/generators` |

`main` at review time was `5af8c01de0b8327153303de3746999b8b41267c0`.

PR #4 and PR #2 fork scaffold at `85f3e44`, which is behind PR #1's head `f081ea0` (VAT, amount, CIDR, cron, markdown). Merging #1 first and then #4 will need a merge, not a fast-forward. That is a merge note, not a logic bug.

## Licences

No GPL, AGPL, or LGPL, any version. `dompurify` is `(MPL-2.0 OR Apache-2.0)`, so Apache-2.0 can be chosen. `@fontsource/inter` is OFL-1.1 (font embedding), not GPL.

PR #1 adds every direct dependency below except `@vitest/coverage-v8`. PR #2 adds only that coverage package. PR #3 and PR #4 add no dependencies. Converters implement YAML, CSV, Base64, and hashes in-tree or with Web Crypto. There is no lodash, moment, js-yaml, or a large crypto library.

| Package | Version | Role | Licence |
| --- | --- | --- | --- |
| `@fontsource/inter` | 5.3.0 | runtime | OFL-1.1 |
| `@unhead/vue` | 2.1.17 | runtime | MIT |
| `diff` | 9.0.0 | runtime | BSD-3-Clause |
| `dompurify` | 3.4.17 | runtime | (MPL-2.0 OR Apache-2.0) |
| `he` | 2.0.0 | runtime | MIT |
| `marked` | 18.2.0 | runtime | MIT |
| `qrcode` | 1.5.4 | runtime | MIT |
| `vue` | 3.5.45 | runtime | MIT |
| `vue-router` | 4.6.4 | runtime | MIT |
| `@eslint/js` | 10.0.1 | dev | MIT |
| `@playwright/test` | 1.65.0 | dev | Apache-2.0 |
| `@types/node` | 26.6.6 | dev | MIT |
| `@vitejs/plugin-vue` | 6.0.10 | dev | MIT |
| `@vitest/coverage-v8` | 5.1.0 | dev, PR #2 only | MIT |
| `eslint` | 10.14.0 | dev | MIT |
| `eslint-plugin-vue` | 10.12.1 | dev | MIT |
| `jsdom` | 28.0.0 | dev, PR #1 head / PR #3 | MIT |
| `typescript` | 5.9.3 | dev | Apache-2.0 |
| `typescript-eslint` | 8.72.2 | dev | MIT |
| `vite` | 7.3.8 | dev | MIT |
| `vite-ssg` | 28.3.0 | dev | MIT |
| `vitest` | 5.1.0 | dev | MIT |
| `vue-tsc` | 3.3.14 | dev | MIT |

`pnpm licenses list` on the PR #1 install: 263 packages, zero GPL / AGPL / LGPL.

## Bundle sizes

`vite-ssg build` (Vite 7.3.8). Tool routes are already `() => import(...)`, so marked, DOMPurify, `he`, `qrcode`, and `diff` are not in the entry chunk. No dependency was added or swapped. Lighter-library ideas below are proposals only.

### PR #3 client JS (the preview that includes converters)

| Chunk | Size | Gzip |
| --- | ---: | ---: |
| `app` | 146.14 kB | 56.50 kB |
| `EntitiesTool` (`he`) | 87.58 kB | 31.18 kB |
| `MarkdownTool` (`marked` + DOMPurify) | 81.22 kB | 27.14 kB |
| `QrTool` (`qrcode`) | 26.35 kB | 10.49 kB |
| `JsonNaYaml` | 8.53 kB | 3.46 kB |
| `ZnacznikCzasu` | 7.36 kB | 3.02 kB |
| `json` | 7.04 kB | 2.28 kB |
| `CronTool` | 6.40 kB | 3.01 kB |
| `DiffTool` | 5.26 kB | 2.35 kB |
| `GeneratorUuid` | 5.14 kB | 2.39 kB |
| other tool chunks | under 5 kB each | |
| CSS `app` | 6.70 kB | 2.12 kB |

Inter is already subset to latin and latin-ext. The woff2 files are 23.66–36.24 kB each. The woff copies are the fallback.

### PR #1 client JS

Same heavy chunks: `app` 133.72 kB (gzip 51.97), `EntitiesTool` 87.58 kB (gzip 31.18), `MarkdownTool` 81.22 kB (gzip 27.14), `QrTool` 26.35 kB (gzip 10.49). Other tool chunks are under 7 kB.

### PR #4 client JS

No markdown chunk (that PR is behind the scaffold head). `app` 137.40 kB (gzip 53.04), `EntitiesTool` 87.58 kB (gzip 31.18), `QrTool` 26.35 kB (gzip 10.49). Generator chunks are 1–6 kB. `GeneratorPesel` is 6.10 kB (gzip 2.68).

Proposal only, after tonight: the entity page is the heaviest tool chunk because `he` ships the named-entity table. A small encode/decode for the characters the page actually needs would drop that chunk. Markdown is already on its own route, which is the right split; do not replace `marked` or DOMPurify in this pass.

## Fix branch

| Branch | Base | Base SHA | What changed |
| --- | --- | --- | --- |
| `review/converters-fixes` | `feat/converters` | `a54749b4ec7c432986d472437f1103f399617fff` | BigInt for JSON / YAML / CSV integers outside `2^53 - 1`, plus unit tests and this file |

No `review/scaffold-fixes` or `review/generators-fixes`. Those trees had no preview-blocking defect to patch. `feat/scaffold`, `feat/converters`, `feat/generators`, `feat/ci-tests`, and `main` were not committed to.

## Tests

| Tree | Command | Result |
| --- | --- | --- |
| PR #1 `f081ea0` | `vitest run` | 11 files, 33 tests, passed |
| PR #3 `a54749b` | `vitest run` | 27 files, 101 tests, passed |
| PR #4 `4add390` | `vitest run` | 21 files, 91 tests, passed |
| `review/converters-fixes` | `vitest run` | 27 files, 104 tests, passed |
| `review/converters-fixes` | `vue-tsc --noEmit` | passed |

New tests cover `9007199254740993`, the negative of that value, `9007199254740991`, YAML `!!python/object` left as text, and CSV export of the big integer.

## Not checked

- Playwright e2e. Browsers were not installed; no UI code was changed.
- `feat/ci-tests` vitest was not executed in that worktree. Its new code is CI and a licence scanner, which was read. The scanner's own self-test logic matches the licence result above.
- Heads may have moved after `f081ea0`, `a54749b`, `4add390`, and `fc24c8c`.
- No live government register lookup. Checksums were checked against the published vectors already in the unit tests and against the ISO IBAN example.
