import { describe, expect, it } from 'vitest'
import { csvToJson, jsonToCsv, parseCsv } from './csv'

describe('csv', () => {
  it('writes objects with a header and escapes commas, quotes, and Polish letters', () => {
    const csv = jsonToCsv(
      JSON.stringify([
        { name: 'Ala', city: 'Kraków' },
        { name: 'Ola', city: 'Łódź', note: 'a, "b"' },
      ]),
    )
    expect(csv).toEqual({
      ok: true,
      value: 'name,city,note\nAla,Kraków,\nOla,Łódź,"a, ""b"""\n',
    })
  })

  it('uses a semicolon and turns one object into a single row', () => {
    expect(jsonToCsv('{"a":1,"b":true}', { delimiter: ';' })).toEqual({ ok: true, value: 'a;b\n1;true\n' })
  })

  it('parses quoted newlines and converts a header back to objects of strings', () => {
    const parsed = parseCsv('name,note\nAla,"linia 1\nlinia 2"\n')
    expect(parsed).toEqual({ ok: true, value: [['name', 'note'], ['Ala', 'linia 1\nlinia 2']] })
    const json = csvToJson('name,city\nAla,Kraków\n')
    expect(json.ok && JSON.parse(json.value)).toEqual([{ name: 'Ala', city: 'Kraków' }])
  })

  it('round-trips arrays of arrays when the header is off', () => {
    const csv = jsonToCsv('[[1,"a,b"],[2,"c"]]')
    expect(csv).toEqual({ ok: true, value: '1,"a,b"\n2,c\n' })
    const json = csvToJson(csv.ok ? csv.value : '', { header: false })
    expect(json.ok && JSON.parse(json.value)).toEqual([
      ['1', 'a,b'],
      ['2', 'c'],
    ])
  })

  it('rejects mixed arrays, an unclosed quote, and a repeated header', () => {
    expect(jsonToCsv('[1, {"a":1}]').ok).toBe(false)
    expect(jsonToCsv('[]').ok).toBe(false)
    expect(parseCsv('"abc').ok).toBe(false)
    expect(csvToJson('a,a\n1,2\n').ok).toBe(false)
  })
})
