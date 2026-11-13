# Agent notes

CurlySpare is a Polish-first, client-only developer tools site. This branch is the shell. Tool implementations, CI, and browser tests belong to other agents.

## Frozen contract

Do not change these paths or shapes.

`src/registry/types.ts`:

```ts
export type ToolCategory = 'generatory' | 'konwertery' | 'kodowanie' | 'tekst' | 'siec' | 'inne'

export interface ToolDefinition {
  slug: string
  title: string
  description: string
  category: ToolCategory
  keywords: string[]
  disclaimer?: string
  component: () => Promise<unknown>
}
```

`src/registry/index.ts` builds `tools` by spreading, in order:

- `generatorTools` from `src/tools/generators/index.ts`
- `converterTools` from `src/tools/converters/index.ts`
- `miscTools` from `src/tools/misc/index.ts`

`miscTools` is an additive registration owned by the shell. The `ToolDefinition` shape did not change. Routes, the home grid, Ctrl/Cmd+K search, and the sitemap all come from that registry. The sitemap is written at the end of `vite-ssg build` from the prerendered pages, which are the registry routes plus the shell pages.

`component` must resolve to a Vue module (`{ default: Component }`). The shell route renders the title, description, and optional `disclaimer`, then the component. Put only the tool UI in the component.

Slugs are lowercase words separated by single hyphens. They must be unique. Do not use `regulamin`, `polityka-prywatnosci`, `operator`, `licencje`, or `404`.

Generators that invent identifiers (PESEL, NIP, REGON, KRS, dowód osobisty, paszport, NRB) must set `disclaimer` to `generatorDisclaimer` exported from `src/brand.ts`. That string is fixed legal copy. The fictional-person generator, the EAN/GTIN generator, and the VAT UE, VIN, ISBN and IBAN checkers use the other disclaimer constants in that file. Do not assign `generatorDisclaimer` to those checkers.

## Ownership

| Area | Owner |
| --- | --- |
| `src/tools/generators/**`, `src/lib/generators/**` | generators agent |
| `src/tools/converters/**`, `src/lib/converters/**` | converters agent |
| `.github/**`, `e2e/**`, `scripts/**`, `tests/**`, Vitest config, Playwright config | tests/CI agent |
| `src/tools/misc/**`, `src/lib/misc/**`, app shell, router, layout, design tokens, registry, search, sitemap, SSG, `vercel.json`, everything else | scaffold |

Do not edit another owner's files. Register a tool only by appending to the array you own.

## Adding a tool

1. Put pure logic in your `src/lib/...` folder and the screen in your `src/tools/...` folder.
2. Append a `ToolDefinition` to `generatorTools` or `converterTools`.
3. Use a Polish `slug` such as `generator-pesel`. Category may be any `ToolCategory`.
4. `keywords` feed search. No server calls and no analytics. Do not persist generated PESEL, NIP, REGON, or IBAN.

## Commit identity

Allowed identities, and no others:

- `Cursor Agent <cursoragent@cursor.com>`
- `Piotr Szewczyk <pszewczykpl@gmail.com>` (no dot before the at-sign)

For agent commits set the author to Cursor Agent and the committer to Piotr Szewczyk with that email. The message must not contain trailers, including `Co-authored-by`. A managed git hook appends a trailer even when `--no-verify` is used. Bypass it with an empty `core.hooksPath` or `git commit-tree`, then check `git log -1 --format='%an <%ae> | %cn <%ce> | %(trailers)'`.

## Model policy

Use Grok 4.7 for this work, including tasks that would otherwise be handed to a larger model. Claude models are not available. Do not use fast variants.

## Run

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

`pnpm test` is Vitest with `--passWithNoTests` until the tests agent adds tests. `pnpm test:e2e` is Playwright; its config is owned by the tests/CI agent.

Vercel: framework Vite, install `pnpm install`, build `pnpm run build`, output `dist`. Set `VITE_SITE_URL` to the public origin. Do not create or link a Vercel project from the agent.
