/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { jsonToXml, xmlToJson } from './xml-json'

describe('xml and json', () => {
  it('maps elements, attributes, text, and repeated tags', () => {
    const json = xmlToJson('<sklep><produkt id="1"><nazwa>bułka</nazwa><tag>a</tag><tag>b</tag></produkt></sklep>')
    expect(json).toEqual({
      ok: true,
      value: `${JSON.stringify(
        {
          sklep: {
            produkt: {
              '@id': '1',
              nazwa: 'bułka',
              tag: ['a', 'b'],
            },
          },
        },
        null,
        2,
      )}\n`,
    })
  })

  it('round-trips a JSON document through XML', () => {
    const source = {
      wiadomosc: {
        '@lang': 'pl',
        '#text': 'cześć & witaj',
      },
    }
    const xml = jsonToXml(JSON.stringify(source))
    expect(xml.ok).toBe(true)
    if (!xml.ok) return
    expect(xml.value).toContain('lang="pl"')
    expect(xml.value).toContain('cześć &amp; witaj')
    expect(xmlToJson(xml.value)).toEqual({ ok: true, value: `${JSON.stringify(source, null, 2)}\n` })
  })

  it('rejects a broken document and a JSON value without one root', () => {
    expect(xmlToJson('<a></b>').ok).toBe(false)
    expect(jsonToXml('[1]').ok).toBe(false)
    expect(jsonToXml('{"a": 1, "b": 2}').ok).toBe(false)
    expect(jsonToXml('{').ok).toBe(false)
  })
})
