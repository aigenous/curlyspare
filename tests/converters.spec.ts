import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const libraryPath = new URL('../src/lib/converters/json.ts', import.meta.url)
const convertersPresent = existsSync(libraryPath)

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

interface Converters {
  formatJson: (input: string, options?: { sortKeys?: boolean }) => Result<string>
  encodeBase64: (text: string, options?: { variant?: 'url' }) => string
  decodeBase64: (text: string) => Result<string>
  encodeUrl: (text: string, mode: 'component' | 'uri' | 'form') => Result<string>
  decodeUrl: (text: string, mode: 'component' | 'uri' | 'form') => Result<string>
  jsonToYaml: (input: string) => Result<string>
  yamlToJson: (input: string) => Result<string>
  jsonToCsv: (input: string) => Result<string>
  csvToJson: (input: string) => Result<string>
  hashUtf8: (text: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512') => Promise<{ hex: string }>
  unixToZoned: (input: string) => Result<{ isoUtc: string; timeZone: string }>
  zonedToUnix: (input: string) => Result<{ isoUtc: string; seconds: number }>
  decodeJwt: (token: string, nowMs?: number) => Result<{ signatureVerified: boolean; algorithm: string | null }>
  generateUuids: (options: { version: 4 | 7; count: number }) => Result<string[]>
}

async function load(file: string): Promise<Record<string, unknown>> {
  return import(file) as Promise<Record<string, unknown>>
}

async function loadConverters(): Promise<Converters> {
  const [json, base64, url, yaml, csv, hash, timestamp, jwt, uuid] = await Promise.all([
    load('../src/lib/converters/json.ts'),
    load('../src/lib/converters/base64.ts'),
    load('../src/lib/converters/url.ts'),
    load('../src/lib/converters/yaml.ts'),
    load('../src/lib/converters/csv.ts'),
    load('../src/lib/converters/hash.ts'),
    load('../src/lib/converters/timestamp.ts'),
    load('../src/lib/converters/jwt.ts'),
    load('../src/lib/converters/uuid.ts'),
  ])
  return {
    formatJson: json.formatJson as Converters['formatJson'],
    encodeBase64: base64.encodeBase64 as Converters['encodeBase64'],
    decodeBase64: base64.decodeBase64 as Converters['decodeBase64'],
    encodeUrl: url.encodeUrl as Converters['encodeUrl'],
    decodeUrl: url.decodeUrl as Converters['decodeUrl'],
    jsonToYaml: yaml.jsonToYaml as Converters['jsonToYaml'],
    yamlToJson: yaml.yamlToJson as Converters['yamlToJson'],
    jsonToCsv: csv.jsonToCsv as Converters['jsonToCsv'],
    csvToJson: csv.csvToJson as Converters['csvToJson'],
    hashUtf8: hash.hashUtf8 as Converters['hashUtf8'],
    unixToZoned: timestamp.unixToZoned as Converters['unixToZoned'],
    zonedToUnix: timestamp.zonedToUnix as Converters['zonedToUnix'],
    decodeJwt: jwt.decodeJwt as Converters['decodeJwt'],
    generateUuids: uuid.generateUuids as Converters['generateUuids'],
  }
}

describe.skipIf(!convertersPresent)('browser converters', () => {
  it('round-trips JSON, Base64, URL, YAML, and CSV and rejects broken input', async () => {
    const api = await loadConverters()
    expect(api.formatJson('{"b":1,"a":2}', { sortKeys: true })).toEqual({
      ok: true,
      value: '{\n  "a": 2,\n  "b": 1\n}\n',
    })
    expect(api.formatJson('{').ok).toBe(false)

    expect(api.encodeBase64('zażółć')).toBe('emHFvMOzxYLEhw==')
    expect(api.decodeBase64('!!!!').ok).toBe(false)

    expect(api.encodeUrl('a b/ą', 'component')).toEqual({ ok: true, value: 'a%20b%2F%C4%85' })
    expect(api.decodeUrl('%', 'component').ok).toBe(false)

    const yaml = api.jsonToYaml('{"a":1}')
    expect(yaml).toEqual({ ok: true, value: 'a: 1\n' })
    if (yaml.ok) expect(api.yamlToJson(yaml.value).ok).toBe(true)

    const csv = api.jsonToCsv('[{"name":"Ala"}]')
    expect(csv).toEqual({ ok: true, value: 'name\nAla\n' })
    if (csv.ok) {
      const back = api.csvToJson(csv.value)
      expect(back.ok).toBe(true)
      if (back.ok) expect(JSON.parse(back.value)).toEqual([{ name: 'Ala' }])
    }
    expect(api.jsonToCsv('[]')).toEqual({ ok: false, error: 'Pusta tablica nie zawiera kolumn CSV.' })
  })

  it('matches published hashes, Warsaw timestamps, unverified JWT, and UUID v4', async () => {
    const api = await loadConverters()
    expect((await api.hashUtf8('abc', 'SHA-256')).hex).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    const epoch = api.unixToZoned('0')
    expect(epoch.ok).toBe(true)
    if (epoch.ok) {
      expect(epoch.value.isoUtc).toBe('1970-01-01T00:00:00.000Z')
      expect(epoch.value.timeZone).toBe('Europe/Warsaw')
    }
    const winter = api.zonedToUnix('2024-01-15 12:00:00')
    expect(winter.ok && winter.value.isoUtc).toBe('2024-01-15T11:00:00.000Z')
    expect(api.zonedToUnix('2024-03-31 02:30:00').ok).toBe(false)

    const token = `${api.encodeBase64(JSON.stringify({ alg: 'none', typ: 'JWT' }), { variant: 'url' })}.${api.encodeBase64(JSON.stringify({ sub: 'ala' }), { variant: 'url' })}.c2ln`
    const decoded = api.decodeJwt(token, Date.parse('2024-06-01T00:00:00Z'))
    expect(decoded.ok).toBe(true)
    if (decoded.ok) {
      expect(decoded.value.signatureVerified).toBe(false)
      expect(decoded.value.algorithm).toBe('none')
    }
    expect(api.decodeJwt('nie.token').ok).toBe(false)

    const generated = api.generateUuids({ version: 4, count: 3 })
    expect(generated.ok).toBe(true)
    if (generated.ok) {
      expect(new Set(generated.value).size).toBe(3)
      for (const value of generated.value) {
        expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      }
    }
  })
})
