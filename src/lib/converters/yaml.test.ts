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

  it('rejects tabs, duplicate keys, and an empty document', () => {
    expect(parseYaml('\ta: 1').ok).toBe(false)
    expect(parseYaml('a: 1\na: 2').ok).toBe(false)
    expect(parseYaml('   \n# tylko komentarz\n').ok).toBe(false)
    expect(jsonToYaml('{').ok).toBe(false)
  })
})
