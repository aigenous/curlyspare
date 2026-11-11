import { describe, expect, it } from 'vitest'
import { generateUuids, inspectUuid } from './uuid'

function randA(uuid: string): number {
  return Number.parseInt(uuid.slice(15, 18), 16)
}

describe('uuid', () => {
  it('generates version 4 identifiers with the RFC variant', () => {
    const generated = generateUuids({ version: 4, count: 20 })
    expect(generated.ok).toBe(true)
    if (!generated.ok) return
    expect(new Set(generated.value).size).toBe(20)
    for (const value of generated.value) {
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      const info = inspectUuid(value)
      expect(info.valid && info.versionLabel).toBe('losowy (v4)')
    }
  })

  it('embeds the timestamp in version 7 and keeps a batch ordered', () => {
    const timestampMs = Date.UTC(2024, 0, 15, 12, 0, 0)
    const generated = generateUuids({ version: 7, count: 5, timestampMs })
    expect(generated.ok).toBe(true)
    if (!generated.ok) return
    let previous = randA(generated.value[0] ?? '')
    generated.value.forEach((value, index) => {
      const info = inspectUuid(value)
      expect(info.valid && info.version).toBe(7)
      expect(info.valid && info.timestampMs).toBe(timestampMs)
      if (index > 0) expect(randA(value)).toBe((previous + 1) & 0xfff)
      previous = randA(value)
    })
  })

  it('can return uppercase identifiers', () => {
    const generated = generateUuids({ version: 4, count: 2, uppercase: true })
    expect(generated.ok).toBe(true)
    if (!generated.ok) return
    expect(generated.value[0]).toBe(generated.value[0]?.toUpperCase())
    expect(inspectUuid(generated.value[0] ?? '').valid).toBe(true)
  })

  it('recognizes urn, braces, nil, and max forms', () => {
    const urn = inspectUuid('urn:uuid:{550e8400-e29b-41d4-a716-446655440000}')
    expect(urn.valid && urn.version).toBe(4)
    expect(urn.valid && urn.variant).toBe('rfc4122')
    const nil = inspectUuid('00000000-0000-0000-0000-000000000000')
    expect(nil.valid && nil.nil && nil.versionLabel).toBe('Nil (same zera)')
    const max = inspectUuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')
    expect(max.valid && max.max).toBe(true)
  })

  it('rejects a bad shape and a bad count', () => {
    expect(inspectUuid('not-a-uuid')).toEqual({ valid: false, error: 'To nie jest UUID.' })
    expect(generateUuids({ version: 4, count: 0 }).ok).toBe(false)
    expect(generateUuids({ version: 4, count: 1001 }).ok).toBe(false)
    expect(generateUuids({ version: 7, count: 1, timestampMs: -1 }).ok).toBe(false)
  })
})
