import { assertNever, err, ok, type Result } from './result'

export type UuidVersion = 4 | 7
export type UuidVariant = 'ncs' | 'rfc4122' | 'microsoft' | 'future'

export interface GenerateUuidOptions {
  version: UuidVersion
  count?: number
  uppercase?: boolean
  timestampMs?: number
}

export type UuidInspection =
  | { valid: false; error: string }
  | {
      valid: true
      uuid: string
      version: number
      versionLabel: string
      variant: UuidVariant
      variantLabel: string
      nil: boolean
      max: boolean
      timestampMs: number | null
    }

const VARIANT_LABELS: Record<UuidVariant, string> = {
  ncs: 'NCS (zarezerwowany)',
  rfc4122: 'RFC 4122',
  microsoft: 'Microsoft',
  future: 'zarezerwowany na przyszłość',
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function uuidV4(): string {
  const bytes = randomBytes(16)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  return formatUuid(bytes)
}

function uuidV7(timestampMs: number, counter: number): string {
  const bytes = randomBytes(16)
  const timestamp = BigInt(timestampMs)
  bytes[0] = Number((timestamp >> 40n) & 0xffn)
  bytes[1] = Number((timestamp >> 32n) & 0xffn)
  bytes[2] = Number((timestamp >> 24n) & 0xffn)
  bytes[3] = Number((timestamp >> 16n) & 0xffn)
  bytes[4] = Number((timestamp >> 8n) & 0xffn)
  bytes[5] = Number(timestamp & 0xffn)
  bytes[6] = 0x70 | ((counter >> 8) & 0x0f)
  bytes[7] = counter & 0xff
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  return formatUuid(bytes)
}

function versionLabel(version: number, nil: boolean, max: boolean): string {
  if (nil) return 'Nil (same zera)'
  if (max) return 'Max (same F)'
  switch (version) {
    case 1:
      return 'czasowy (v1)'
    case 2:
      return 'DCE (v2)'
    case 3:
      return 'MD5 (v3)'
    case 4:
      return 'losowy (v4)'
    case 5:
      return 'SHA-1 (v5)'
    case 6:
      return 'czasowy uporządkowany (v6)'
    case 7:
      return 'czas uniksowy (v7)'
    case 8:
      return 'własny (v8)'
    default:
      return `nieznana (v${version})`
  }
}

function variantOf(nibble: number): UuidVariant {
  if ((nibble & 0x8) === 0) return 'ncs'
  if ((nibble & 0xc) === 0x8) return 'rfc4122'
  if ((nibble & 0xe) === 0xc) return 'microsoft'
  return 'future'
}

function canonicalUuid(input: string): string | null {
  let value = input.trim()
  if (value.toLowerCase().startsWith('urn:uuid:')) value = value.slice('urn:uuid:'.length)
  if (value.startsWith('{') && value.endsWith('}')) value = value.slice(1, -1)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return null
  return value.toLowerCase()
}

export function inspectUuid(input: string): UuidInspection {
  const uuid = canonicalUuid(input)
  if (!uuid) return { valid: false, error: 'To nie jest UUID.' }
  const version = Number.parseInt(uuid.charAt(14), 16)
  const variantNibble = Number.parseInt(uuid.charAt(19), 16)
  const variant = variantOf(variantNibble)
  const nil = uuid === '00000000-0000-0000-0000-000000000000'
  const max = uuid === 'ffffffff-ffff-ffff-ffff-ffffffffffff'
  const timestampMs = version === 7 ? Number(BigInt(`0x${uuid.replaceAll('-', '').slice(0, 12)}`)) : null
  return {
    valid: true,
    uuid,
    version,
    versionLabel: versionLabel(version, nil, max),
    variant,
    variantLabel: VARIANT_LABELS[variant],
    nil,
    max,
    timestampMs,
  }
}

export function generateUuids(options: GenerateUuidOptions): Result<string[]> {
  const count = options.count ?? 1
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    return err('Liczba identyfikatorów musi być liczbą całkowitą od 1 do 1000.')
  }
  const version = options.version
  let values: string[]
  switch (version) {
    case 4:
      values = Array.from({ length: count }, () => uuidV4())
      break
    case 7: {
      let timestamp = options.timestampMs ?? Date.now()
      if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > 2 ** 48 - 1) {
        return err('Znacznik czasu UUID v7 jest poza zakresem 48 bitów.')
      }
      const seed = randomBytes(2)
      let counter = (((seed[0] ?? 0) << 8) | (seed[1] ?? 0)) & 0xfff
      values = []
      for (let index = 0; index < count; index += 1) {
        values.push(uuidV7(timestamp, counter))
        counter += 1
        if (counter > 0xfff) {
          counter = 0
          timestamp += 1
        }
      }
      break
    }
    default:
      return assertNever(version)
  }
  if (options.uppercase) values = values.map((value) => value.toUpperCase())
  return ok(values)
}
