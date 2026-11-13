import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { describe, expect, it } from 'vitest'
import { tools } from './index'
import { publishedSlugList } from './published-slugs'

const sitemapPaths = ['/', '/operator', '/polityka-prywatnosci', '/regulamin']

function draftToolPath(): string {
  const allowed = new Set<string>(publishedSlugList)
  const slug = tools.map((tool) => tool.slug).find((item) => !allowed.has(item))
  if (!slug) throw new Error('Expected an unpublished tool in the registry.')
  return `/${slug}`
}

function productionEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    MODE: 'production',
    VITE_USER_NODE_ENV: 'production',
    VITE_SHOW_DRAFTS: '',
  }
  delete env.VITE_SITE_URL
  for (const key of Object.keys(env)) {
    if (key.startsWith('VITEST')) delete env[key]
  }
  return env
}

function freePort(): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address == null || typeof address === 'string') {
        server.close()
        reject(new Error('Could not reserve a preview port.'))
        return
      }
      const { port } = address
      server.close((error) => {
        if (error) reject(error)
        else resolvePort(port)
      })
    })
  })
}

function signal(child: ChildProcess, name: NodeJS.Signals): void {
  if (child.pid == null) return
  try {
    process.kill(-child.pid, name)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH') return
    child.kill(name)
  }
}

function run(args: readonly string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('pnpm', [...args], { env, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`pnpm ${args.join(' ')} exited with ${code}`))
    })
  })
}

function startPreview(port: number, env: NodeJS.ProcessEnv): Promise<ChildProcess> {
  const child = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  return new Promise((resolvePromise, reject) => {
    let output = ''
    let settled = false
    const fail = (error: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal(child, 'SIGTERM')
      reject(error)
    }
    const timer = setTimeout(() => fail(new Error(`Preview did not start.\n${output}`)), 30_000)
    const onData = (chunk: Buffer) => {
      output += chunk.toString()
      if (settled || !output.includes(`http://127.0.0.1:${port}`)) return
      settled = true
      clearTimeout(timer)
      resolvePromise(child)
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.once('error', fail)
    child.once('exit', (code) => fail(new Error(`Preview exited with ${code} before it was ready.\n${output}`)))
  })
}

async function stop(child: ChildProcess): Promise<void> {
  if (child.pid == null || child.exitCode != null) return
  await new Promise<void>((resolvePromise) => {
    const timer = setTimeout(() => {
      signal(child, 'SIGKILL')
      resolvePromise()
    }, 5_000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolvePromise()
    })
    signal(child, 'SIGTERM')
  })
}

describe('production preview', () => {
  it('returns 404 for a draft tool and lists four sitemap urls', async () => {
    const port = await freePort()
    const env = productionEnv()
    await run(['exec', 'vite-ssg', 'build'], env)
    const preview = await startPreview(port, env)
    try {
      const home = await fetch(`http://127.0.0.1:${port}/`)
      expect(home.status).toBe(200)
      const draft = await fetch(`http://127.0.0.1:${port}${draftToolPath()}`)
      expect(draft.status).toBe(404)
      expect(await draft.text()).toContain('Nie ma takiej strony')
      const sitemap = await fetch(`http://127.0.0.1:${port}/sitemap.xml`)
      expect(sitemap.status).toBe(200)
      const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (match) => new URL(match[1] ?? '').pathname,
      )
      expect(locs).toEqual(sitemapPaths)
    } finally {
      await stop(preview)
    }
  }, 180_000)
})
