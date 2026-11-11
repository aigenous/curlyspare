import { describe, expect, it } from 'vitest'
import { jsonToToml, tomlToJson } from './toml'

describe('toml and json', () => {
  it('reads comments, strings, and numbers', () => {
    const parsed = tomlToJson('# komentarz\nname = "Ala"\ncount = 2\n')
    expect(parsed).toEqual({ ok: true, value: `${JSON.stringify({ name: 'Ala', count: 2 }, null, 2)}\n` })
  })

  it('round-trips an object with an array and a nested table', () => {
    const source = { title: 'zażółć', tags: ['a', 'b'], owner: { name: 'Ola' } }
    const toml = jsonToToml(JSON.stringify(source))
    expect(toml.ok).toBe(true)
    if (!toml.ok) return
    expect(tomlToJson(toml.value)).toEqual({ ok: true, value: `${JSON.stringify(source, null, 2)}\n` })
  })

  it('rejects an empty document, a duplicate key, and a JSON array', () => {
    expect(tomlToJson('   \n').ok).toBe(false)
    expect(tomlToJson('a = 1\na = 2\n').ok).toBe(false)
    expect(jsonToToml('[1, 2]').ok).toBe(false)
    expect(jsonToToml('{').ok).toBe(false)
  })
})