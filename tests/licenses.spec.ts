import { describe, expect, it } from 'vitest'
import { forbiddenPackages, isCopyleftOnly } from '../scripts/check-licenses.mjs'

describe('licence classification', () => {
  it('rejects a dependency that can only be used under GPL, AGPL, or LGPL', () => {
    expect(isCopyleftOnly('MIT')).toBe(false)
    expect(isCopyleftOnly('GPL-3.0-only')).toBe(true)
    expect(isCopyleftOnly('GPL-2.0-or-later')).toBe(true)
    expect(isCopyleftOnly('LGPL-2.1-only')).toBe(true)
    expect(isCopyleftOnly('AGPL-3.0-or-later')).toBe(true)
    expect(isCopyleftOnly('MIT OR GPL-3.0-only')).toBe(false)
    expect(isCopyleftOnly('GPL-2.0-only OR AGPL-3.0-only')).toBe(true)
    expect(isCopyleftOnly('MIT AND LGPL-3.0-only')).toBe(true)
  })

  it('reads both grouped and flat pnpm licence reports', () => {
    const found = forbiddenPackages({
      MIT: [{ name: 'ok', version: '1.0.0', license: 'MIT' }],
      'GPL-3.0-only': [{ name: 'copyleft', version: '2.0.0', license: 'GPL-3.0-only' }],
      'dual@1.0.0': { name: 'dual', version: '1.0.0', license: 'Apache-2.0 OR MIT' },
    })
    expect(found.map((pkg) => pkg.name)).toEqual(['copyleft'])
  })
})
