import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const dirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'curlyspare-dist-'))
  dirs.push(dir)
  return dir
}

function run(script: string, args: string[], env: NodeJS.ProcessEnv): { code: number; output: string } {
  try {
    const stdout = execFileSync('bash', [script, ...args], { encoding: 'utf8', env })
    return { code: 0, output: stdout }
  } catch (error) {
    const failed = error as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer }
    const stdout = typeof failed.stdout === 'string' ? failed.stdout : (failed.stdout?.toString('utf8') ?? '')
    const stderr = typeof failed.stderr === 'string' ? failed.stderr : (failed.stderr?.toString('utf8') ?? '')
    return { code: failed.status ?? 1, output: `${stdout}${stderr}` }
  }
}

function baseEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[key]
    else env[key] = value
  }
  return env
}

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

describe('check-dist-fonts.sh', () => {
  it('fails when the dist directory is missing', () => {
    const missing = join(tempDir(), 'missing')
    const result = run('scripts/check-dist-fonts.sh', [missing], baseEnv())
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL: dist directory not found')
  })

  it('fails when the assets directory is missing', () => {
    const dist = tempDir()
    const result = run('scripts/check-dist-fonts.sh', [dist], baseEnv())
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL: assets directory not found')
  })

  it('fails when the assets directory has no woff2 file', () => {
    const dist = tempDir()
    mkdirSync(join(dist, 'assets'))
    const result = run('scripts/check-dist-fonts.sh', [dist], baseEnv())
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL: no .woff2 files')
  })

  it('passes a fixture with a local woff2 and no third-party hosts', () => {
    const dist = tempDir()
    mkdirSync(join(dist, 'assets'))
    writeFileSync(join(dist, 'assets', 'inter.woff2'), '')
    writeFileSync(join(dist, 'index.html'), '<link rel="stylesheet" href="/assets/app.css">')
    writeFileSync(join(dist, 'assets', 'app.css'), 'body{font-family:Inter;}')
    const result = run('scripts/check-dist-fonts.sh', [dist], baseEnv())
    expect(result.output).toContain('PASS: no third-party font/CDN hosts')
    expect(result.code).toBe(0)
  })
})

describe('check-site-url.sh', () => {
  const placeholderSitemap = '<?xml version="1.0"?><urlset><url><loc>https://devnarzedzia.example/</loc></url></urlset>\n'
  const realSitemap = '<?xml version="1.0"?><urlset><url><loc>https://curlyspare.vercel.app/</loc></url></urlset>\n'

  it('fails a production build that still uses the placeholder host', () => {
    const dist = tempDir()
    writeFileSync(join(dist, 'sitemap.xml'), placeholderSitemap)
    writeFileSync(
      join(dist, 'index.html'),
      '<link rel="canonical" href="https://devnarzedzia.example/"><meta property="og:url" content="https://devnarzedzia.example/">',
    )
    const result = run('scripts/check-site-url.sh', [dist], baseEnv({ VERCEL_ENV: 'production' }))
    expect(result.code).not.toBe(0)
    expect(result.output).toContain('FAIL: production build still references devnarzedzia.example')
    expect(result.output).toContain('sitemap.xml')
    expect(result.output).toContain('rel="canonical"')
  })

  it('passes a production build that uses the real host', () => {
    const dist = tempDir()
    writeFileSync(join(dist, 'sitemap.xml'), realSitemap)
    writeFileSync(
      join(dist, 'index.html'),
      '<p>Sample text mentions devnarzedzia.example and must not fail the check.</p><link rel="canonical" href="https://curlyspare.vercel.app/"><meta property="og:url" content="https://curlyspare.vercel.app/">',
    )
    const result = run('scripts/check-site-url.sh', [dist], baseEnv({ VERCEL_ENV: 'production' }))
    expect(result.output).toContain('PASS: production site URL does not use devnarzedzia.example')
    expect(result.code).toBe(0)
  })

  it('passes a non-production build that still uses the placeholder host', () => {
    const dist = tempDir()
    writeFileSync(join(dist, 'sitemap.xml'), placeholderSitemap)
    writeFileSync(join(dist, 'index.html'), '<link rel="canonical" href="https://devnarzedzia.example/">')
    const result = run('scripts/check-site-url.sh', [dist], baseEnv({ VERCEL_ENV: undefined }))
    expect(result.output).toContain('WARN:')
    expect(result.output).toContain('PASS: site URL check skipped outside production')
    expect(result.code).toBe(0)
  })
})

function commitIdentitySelfTestOutput(): string {
  try {
    return execFileSync('bash', ['scripts/test-check-commit-identity.sh'], { encoding: 'utf8' })
  } catch (error) {
    const failed = error as { stdout?: string | Buffer; stderr?: string | Buffer }
    const stdout = typeof failed.stdout === 'string' ? failed.stdout : (failed.stdout?.toString('utf8') ?? '')
    const stderr = typeof failed.stderr === 'string' ? failed.stderr : (failed.stderr?.toString('utf8') ?? '')
    return `${stdout}${stderr}`
  }
}

describe('check-commit-identity self-test', () => {
  it('passes every fixture, including the allowlist and trailer cases', () => {
    expect(commitIdentitySelfTestOutput()).toContain('0 failed')
  })
})
