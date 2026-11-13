/// <reference types="vite-ssg" />
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { assertOperatorReadyForLaunch } from './src/lib/operatorLaunch'
import { shellPaths, visibleSlugs } from './src/registry/published-slugs'
import { site } from './src/site'

function registeredSlugs(): string[] {
  const files = ['src/tools/misc/index.ts', 'src/tools/generators/index.ts', 'src/tools/converters/index.ts']
  return files.flatMap((file) =>
    [...readFileSync(resolve(file), 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1] ?? ''),
  )
}

function visibleToolPaths(showDrafts: boolean): string[] {
  return visibleSlugs(registeredSlugs(), showDrafts).map((slug) => `/${slug}`)
}

function concretePaths(paths: readonly string[]): string[] {
  return paths.filter((path) => !path.includes(':') && !path.includes('*'))
}

/** Strip HTML comments from Lawyer markdown before it is bundled as a raw import. */
export function stripLegalComments(): Plugin {
  return {
    name: 'strip-legal-html-comments',
    enforce: 'pre',
    load(id) {
      const queryAt = id.indexOf('?')
      const filename = queryAt === -1 ? id : id.slice(0, queryAt)
      const query = queryAt === -1 ? '' : id.slice(queryAt + 1)
      if (!new URLSearchParams(query).has('raw')) return null
      const normalized = filename.replaceAll('\\', '/')
      if (!/\/src\/content\/legal\/[^/]+\.md$/.test(normalized)) return null
      const stripped = readFileSync(filename, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
      return `export default ${JSON.stringify(stripped)}`
    },
  }
}

function operatorLaunchGuard(): Plugin {
  return {
    name: 'operator-launch-guard',
    buildStart() {
      const legalDocuments = ['src/content/legal/regulamin.md', 'src/content/legal/polityka-prywatnosci.md'].map((file) =>
        readFileSync(resolve(file), 'utf8'),
      )
      assertOperatorReadyForLaunch(site.operator, process.env.REQUIRE_OPERATOR_DATA, console.warn, legalDocuments)
    },
  }
}

function publishThirdPartyLicenses(): Plugin {
  const serve = (req: { url?: string }, res: { setHeader: (name: string, value: string) => void, end: (body?: string) => void }, next: () => void) => {
    const pathname = (req.url ?? '/').split('?')[0]
    if (pathname !== '/THIRD-PARTY-LICENSES.txt') {
      next()
      return
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end(readFileSync(resolve('THIRD_PARTY_LICENSES.txt'), 'utf8'))
  }
  return {
    name: 'third-party-licenses',
    configureServer(server) {
      server.middlewares.use(serve)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve)
    },
  }
}

function previewNotFound(): Plugin {
  return {
    name: 'preview-not-found',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next()
          return
        }
        const pathname = (req.url ?? '/').split('?')[0] ?? '/'
        if (pathname.startsWith('/assets/') || pathname.startsWith('/@') || pathname.includes('.')) {
          next()
          return
        }
        const page = pathname === '/' ? 'index.html' : `${pathname.replace(/^\//, '')}.html`
        if (existsSync(resolve('dist', page))) {
          next()
          return
        }
        const notFound = resolve('dist/404.html')
        if (!existsSync(notFound)) {
          next()
          return
        }
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(req.method === 'HEAD' ? undefined : readFileSync(notFound))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const showDrafts = env.VITE_SHOW_DRAFTS === '1'
  const siteUrl = (env.VITE_SITE_URL || site.defaultSiteUrl).replace(/\/$/, '')
  const prerendered = [...shellPaths, ...visibleToolPaths(showDrafts), '/404']

  return {
    plugins: [stripLegalComments(), vue(), operatorLaunchGuard(), publishThirdPartyLicenses(), previewNotFound()],
    ssgOptions: {
      dirStyle: 'flat',
      includedRoutes(paths) {
        // Router paths come from publicTools(). Keep the same slug filter here.
        const linked = concretePaths(paths)
        const allowed = new Set<string>(prerendered)
        const linkedSet = new Set(linked)
        const notPrerendered = linked.filter((path) => !allowed.has(path))
        const notLinked = prerendered.filter((path) => !linkedSet.has(path))
        if (notPrerendered.length > 0 || notLinked.length > 0) {
          throw new Error(
            `Linked pages and prerendered pages disagree. Linked but not prerendered: ${notPrerendered.join(', ') || 'none'}. Prerendered but not linked: ${notLinked.join(', ') || 'none'}.`,
          )
        }
        return linked
      },
      onFinished() {
        const dist = resolve('dist')
        const pages = readdirSync(dist)
          .filter((file) => file.endsWith('.html') && file !== '404.html')
          .map((file) => (file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`))
          .sort((a, b) => a.localeCompare(b))
        const expected = prerendered.filter((path) => path !== '/404').sort((a, b) => a.localeCompare(b))
        const missing = expected.filter((path) => !pages.includes(path))
        const extra = pages.filter((path) => !expected.includes(path))
        if (missing.length > 0 || extra.length > 0) {
          throw new Error(`Sitemap pages do not match the allowlist. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`)
        }
        if (!existsSync(resolve(dist, '404.html'))) {
          throw new Error('Missing prerendered 404 page.')
        }
        const urls = expected
          .map((path) => `  <url><loc>${siteUrl}${path === '/' ? '/' : path}</loc></url>`)
          .join('\n')
        writeFileSync(
          resolve(dist, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        )
        writeFileSync(
          resolve(dist, 'robots.txt'),
          `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
        )
        copyFileSync(resolve('THIRD_PARTY_LICENSES.txt'), resolve(dist, 'THIRD-PARTY-LICENSES.txt'))
      },
    },
  }
})
