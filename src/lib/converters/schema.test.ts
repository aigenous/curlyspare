import { describe, expect, it } from 'vitest'
import { validateJsonSchema } from './schema'

const schema = JSON.stringify({
  type: 'object',
  additionalProperties: false,
  required: ['a'],
  properties: { a: { type: 'number', minimum: 0 } },
})

describe('json schema', () => {
  it('accepts data that matches the schema', () => {
    expect(validateJsonSchema('{"a": 1}', schema)).toEqual({ ok: true, value: 'Dane pasują do schematu.' })
  })

  it('lists every failing constraint in Polish', () => {
    const result = validateJsonSchema('{"b": 1}', schema)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('brakuje pola „a”')
    expect(result.error).toContain('niedozwolone pole „b”')
  })

  it('rejects a value below the minimum and a broken schema', () => {
    const low = validateJsonSchema('{"a": -1}', schema)
    expect(low.ok).toBe(false)
    if (!low.ok) expect(low.error).toContain('/a:')
    expect(validateJsonSchema('{', schema).ok).toBe(false)
    expect(validateJsonSchema('1', '[]').ok).toBe(false)
    expect(validateJsonSchema('1', '{"type": "nope"}').ok).toBe(false)
  })
})
