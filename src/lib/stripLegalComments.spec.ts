import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { stripLegalComments } from '../../vite.config'

describe('stripLegalComments', () => {
  it('strips an HTML comment from a legal raw import before it is bundled', () => {
    const root = mkdtempSync(join(tmpdir(), 'legal-md-'))
    const file = join(root, 'src/content/legal/fixture.md')
    mkdirSync(join(root, 'src/content/legal'), { recursive: true })
    writeFileSync(file, 'Widoczny tekst. <!-- [TEST-KOMENTARZ] -->\n')
    const plugin = stripLegalComments()
    const load = plugin.load
    if (typeof load !== 'function') throw new Error('load hook missing')
    const bundled = load.call({} as never, `${file}?raw`)
    expect(bundled).toBe(`export default ${JSON.stringify('Widoczny tekst. \n')}`)
    expect(String(bundled)).not.toContain('TEST-KOMENTARZ')
    expect(String(bundled)).not.toContain('<!--')
    expect(load.call({} as never, `${file}?url`)).toBeNull()
  })
})
