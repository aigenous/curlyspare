import { describe, expect, it } from 'vitest'
import { queryJsonPath } from './jsonpath'

const store = {
  store: {
    book: [
      { title: 'Ala', price: 8 },
      { title: 'Ola', price: 12 },
    ],
  },
}

describe('jsonpath', () => {
  it('returns every match, including a filter', () => {
    const titles = queryJsonPath(JSON.stringify(store), '$.store.book[*].title')
    expect(titles).toEqual({ ok: true, value: `${JSON.stringify(['Ala', 'Ola'], null, 2)}\n` })
    const expensive = queryJsonPath(JSON.stringify(store), '$..book[?(@.price>10)].title')
    expect(expensive).toEqual({ ok: true, value: `${JSON.stringify(['Ola'], null, 2)}\n` })
  })

  it('rejects a path that does not start with $ and broken JSON', () => {
    expect(queryJsonPath('{}', 'book').ok).toBe(false)
    expect(queryJsonPath('{', '$.a').ok).toBe(false)
    expect(queryJsonPath('{}', '$[?(@.a ==)]').ok).toBe(false)
    expect(queryJsonPath('{}', '$[').ok).toBe(false)
  })
})
