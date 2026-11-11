import { describe, expect, it } from 'vitest'
import { compressToBase64, decompressFromBase64 } from './compress'

describe('gzip and deflate', () => {
  it('round-trips UTF-8 text through gzip and deflate', async () => {
    for (const format of ['gzip', 'deflate'] as const) {
      const encoded = await compressToBase64('zażółć gęślą jaźń', format)
      expect(encoded.ok).toBe(true)
      if (!encoded.ok) return
      expect(encoded.value).toMatch(/^[A-Za-z0-9+/]+=*$/)
      expect(await decompressFromBase64(encoded.value, format)).toEqual({ ok: true, value: 'zażółć gęślą jaźń' })
    }
  })

  it('round-trips an empty string and rejects the wrong format', async () => {
    const gzip = await compressToBase64('', 'gzip')
    expect(gzip.ok).toBe(true)
    if (!gzip.ok) return
    expect(await decompressFromBase64(gzip.value, 'gzip')).toEqual({ ok: true, value: '' })
    expect((await decompressFromBase64(gzip.value, 'deflate')).ok).toBe(false)
    expect((await decompressFromBase64('@@@', 'gzip')).ok).toBe(false)
  })
})
