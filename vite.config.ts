/// <reference types="vite-ssg" />
import { readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { site } from './src/site'

const siteUrl = (process.env.VITE_SITE_URL || site.defaultSiteUrl).replace(/\/$/, '')

export default defineConfig({
  plugins: [vue()],
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
    },
  },
})
