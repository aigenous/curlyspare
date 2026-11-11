import { describe, expect, it } from 'vitest'
import { jsonToYaml, parseYaml, yamlToJson } from './yaml'

const documents = [
  { a: 1, b: 'zażółć', c: true, d: null },
  { items: [{ name: 'Ala', tags: ['a', 'b'] }, { name: 'Ola' }] },
  { msg: 'hello: world', empty: '', n: 0, f: false, quote: 'a "b"\nc' },
  { arr: [], obj: {} },
  [1, 'x', { a: [true, null] }],
  [[1, 2], { 'klucz:z:dwukropkiem': 'ok' }],
]

describe('yaml', () => {
  it('round-trips JSON values through the block subset', () => {
    for (const document of documents) {
      const yaml = jsonToYaml(JSON.stringify(document))
      expect(yaml.ok).toBe(true)
      if (!yaml.ok) return
      const back = parseYaml(yaml.value)
      expect(back).toEqual({ ok: true, value: document })
      const json = yamlToJson(yaml.value)
      expect(json.ok).toBe(true)
      if (json.ok) expect(JSON.parse(json.value)).toEqual(document)
    }
  })

  it('reads comments, quotes, and a document start marker', () => {
    const parsed = parseYaml('---\n# komentarz\nname: "Ala: Ola" # inline\ncount: 2\n')
    expect(parsed).toEqual({ ok: true, value: { name: 'Ala: Ola', count: 2 } })
  })

  it('keeps integers beyond 2^53 and leaves smaller integers as numbers', () => {
    expect(parseYaml('id: 9007199254740993\n')).toEqual({
      ok: true,
      value: { id: 9007199254740993n },
    })
    expect(yamlToJson('id: 9007199254740993\n')).toEqual({
      ok: true,
      value: '{\n  "id": 9007199254740993\n}\n',
    })
    expect(jsonToYaml('{"id":9007199254740993}')).toEqual({ ok: true, value: 'id: 9007199254740993\n' })
    expect(parseYaml('id: 42')).toEqual({ ok: true, value: { id: 42 } })
    for (const source of ['n: 1e20\n', 'n: 1E16\n', 'n: 9007199254740993.0\n']) {
      const parsed = parseYaml(source)
      expect(parsed.ok).toBe(true)
      if (!parsed.ok || parsed.value === null || typeof parsed.value !== 'object') return
      expect(typeof (parsed.value as { n: unknown }).n).toBe('number')
      expect(yamlToJson(source).ok).toBe(true)
    }
  })

  it('keeps a __proto__ key as an own property', () => {
    const parsed = parseYaml('"__proto__":\n  polluted: true\n')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || parsed.value === null || typeof parsed.value !== 'object') return
    expect(Object.hasOwn(parsed.value, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(parsed.value)).toBeNull()
    expect(Object.prototype).not.toHaveProperty('polluted')
    const json = yamlToJson('"__proto__":\n  polluted: true\n')
    expect(json.ok && json.value).toContain('"__proto__"')
    expect(Object.prototype).not.toHaveProperty('polluted')
  })

  it('rejects tabs, duplicate keys, and an empty document', () => {
    expect(parseYaml('\ta: 1').ok).toBe(false)
    expect(parseYaml('a: 1\na: 2').ok).toBe(false)
    expect(parseYaml('   \n# tylko komentarz\n').ok).toBe(false)
    expect(jsonToYaml('{').ok).toBe(false)
  })
})
