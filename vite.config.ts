/// <reference types="vite-ssg" />
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { shellPaths, visibleSlugs } from './src/registry/published-slugs'
import { site } from './src/site'

const showDrafts = process.env.VITE_SHOW_DRAFTS === '1'

function registeredSlugs(): string[] {
  const files = ['src/tools/misc/index.ts', 'src/tools/generators/index.ts', 'src/tools/converters/index.ts']
  return files.flatMap((file) =>
    [...readFileSync(resolve(file), 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1] ?? ''),
  )
}

function visibleToolPaths(): string[] {
  return visibleSlugs(registeredSlugs(), showDrafts).map((slug) => `/${slug}`)
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
  plugins: [vue(), previewNotFound()],
  ssgOptions: {
    dirStyle: 'flat',
    includedRoutes(paths) {
      // Router paths come from publicTools(). Keep the same slug filter here.
      const allowed = new Set<string>([...shellPaths, ...visibleToolPaths(), '/404'])
      return paths.filter((path) => allowed.has(path))
    },
    onFinished() {
      const dist = resolve('dist')
      const pages = readdirSync(dist)
        .filter((file) => file.endsWith('.html') && file !== '404.html')
        .map((file) => (file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`))
        .sort((a, b) => a.localeCompare(b))
      const expected = [...shellPaths, ...visibleToolPaths()].sort((a, b) => a.localeCompare(b))
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
    },
  },
})
