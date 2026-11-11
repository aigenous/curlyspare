import { describe, expect, it } from 'vitest'
import { csvToMarkdown } from './csv-markdown'

describe('csv to markdown', () => {
  it('renders a header, a separator, and escaped pipes', () => {
    expect(csvToMarkdown('a,b\n1,2\n"x|y",z\n')).toEqual({
      ok: true,
      value: '| a | b |\n| --- | --- |\n| 1 | 2 |\n| x\\|y | z |\n',
    })
  })

  it('reads a semicolon file and keeps a header without rows', () => {
    expect(csvToMarkdown('nazwa;cena\nbułka;2,5\n', ';')).toEqual({
      ok: true,
      value: '| nazwa | cena |\n| --- | --- |\n| bułka | 2,5 |\n',
    })
    expect(csvToMarkdown('tylko\n')).toEqual({ ok: true, value: '| tylko |\n| --- |\n' })
  })

  it('rejects an empty table and a broken quote', () => {
    expect(csvToMarkdown('').ok).toBe(false)
    expect(csvToMarkdown('"otwarte').ok).toBe(false)
  })
})