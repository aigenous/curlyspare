/// <reference types="vite-ssg" />
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { assertOperatorReadyForLaunch } from './src/lib/operatorLaunch'
import { site } from './src/site'

const shellPaths = ['/', '/regulamin', '/polityka-prywatnosci', '/operator', '/licencje']

function registeredSlugs(): string[] {
  const files = ['src/tools/misc/index.ts', 'src/tools/generators/index.ts', 'src/tools/converters/index.ts']
  return files.flatMap((file) =>
    [...readFileSync(resolve(file), 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1] ?? ''),
  )
}

function operatorLaunchGuard(): Plugin {
  return {
    name: 'operator-launch-guard',
    buildStart() {
      assertOperatorReadyForLaunch(site.operator, process.env.REQUIRE_OPERATOR_DATA)
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

const siteUrl = (process.env.VITE_SITE_URL || site.defaultSiteUrl).replace(/\/$/, '')

export default defineConfig({
  plugins: [vue(), operatorLaunchGuard(), publishThirdPartyLicenses(), previewNotFound()],
  ssgOptions: {
    dirStyle: 'flat',
    includedRoutes(paths) {
      return paths.filter((path) => !path.includes(':'))
    },
    onFinished() {
      const dist = resolve('dist')
      const pages = readdirSync(dist)
        .filter((file) => file.endsWith('.html') && file !== '404.html')
        .map((file) => (file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`))
        .sort((a, b) => a.localeCompare(b))
      const expected = new Set([...shellPaths, ...registeredSlugs().map((slug) => `/${slug}`)])
      const built = new Set(pages)
      const missing = [...expected].filter((path) => !built.has(path))
      if (missing.length > 0) {
        throw new Error(`Brak stron w mapie witryny: ${missing.join(', ')}`)
      }
      if (built.has('/404')) {
        throw new Error('Mapa witryny nie może zawierać strony 404.')
      }
      const urls = pages
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
})
