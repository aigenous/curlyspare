import { describe, expect, it } from 'vitest'
import { jsonToTypeScript } from './typescript'

describe('json to typescript', () => {
  it('builds interfaces and marks keys missing from some items as optional', () => {
    const source = {
      name: 'Ala',
      age: 3,
      ok: true,
      tags: ['a', 'b'],
      child: { name: 'Ola' },
      items: [
        { id: 1, note: 'x' },
        { id: 2 },
      ],
    }
    expect(jsonToTypeScript(JSON.stringify(source))).toEqual({
      ok: true,
      value: `export interface Root {
  name: string
  age: number
  ok: boolean
  tags: string[]
  child: Child
  items: Items[]
}

export interface Child {
  name: string
}

export interface Items {
  id: number
  note?: string
}
`,
    })
  })

  it('types a top-level array and a quoted property', () => {
    expect(jsonToTypeScript('[1, "a"]', 'Numbers')).toEqual({
      ok: true,
      value: 'export type Numbers = (number | string)[]\n',
    })
    const named = jsonToTypeScript('{"a-b": true}')
    expect(named.ok && named.value).toContain('"a-b": boolean')
  })

  it('rejects a bad type name and broken JSON', () => {
    expect(jsonToTypeScript('1', '1Root').ok).toBe(false)
    expect(jsonToTypeScript('{', 'Root').ok).toBe(false)
  })
})
