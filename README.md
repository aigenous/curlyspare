# CurlySpare

Polish-first developer tools (working name **DevNarzędzia**). Everything runs in the browser. This repository’s shell is Vue 3, TypeScript, Vite, and vite-ssg, installed with pnpm.

The tool registry, route ownership, and commit rules live in [AGENTS.md](AGENTS.md).

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

`pnpm build` prerenders each route to `dist/<slug>.html` and writes `sitemap.xml` from those pages. History-mode URLs such as `/generator-pesel` are real HTML files.

## Vercel

Do not link or deploy a project from automation. In the Vercel project settings use:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Install command | `pnpm install` |
| Build command | `pnpm run build` |
| Output directory | `dist` |
| Node.js | 22 |

`vercel.json` turns on clean URLs so `dist/generator-pesel.html` is served at `/generator-pesel`. Unknown paths use `dist/404.html`. Set `VITE_SITE_URL` (see `.env.example`) to the public origin before a production build so canonical links and the sitemap match the domain.

## Layout

- `src/registry` — typed tool list. Home, search, routes, and the sitemap read it.
- `src/tools/generators` and `src/tools/converters` — tool modules. Empty until those agents land.
- `src/tools/misc` — shell-owned tools: letter case, text counter, Polish lorem, slugify, QR, HEX/RGB/HSL.
- `src/styles/tokens.css` — cobalt `#315CB4`, navy `#254779`, cream `#F4F1EA`, light and dark. No green.
- Shell pages: `/`, `/regulamin`, `/polityka-prywatnosci`, `/operator`, `/404`.

Ctrl or Cmd+K opens search over the registry. The only `localStorage` key is the theme.
