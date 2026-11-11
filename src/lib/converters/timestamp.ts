import { err, ok, type Result } from './result'

export const DEFAULT_TIME_ZONE = 'Europe/Warsaw'

export const COMMON_TIME_ZONES = [
  'Europe/Warsaw',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
] as const

export type UnixUnit = 'auto' | 'seconds' | 'milliseconds'

export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

export interface UnixView {
  seconds: number
  milliseconds: number
  isoUtc: string
  timeZone: string
  local: string
  parts: ZonedParts
  ambiguous: boolean
}

export function isValidTimeZone(timeZone: string): boolean {
  const zone = timeZone.trim()
  if (zone === '') return false
  try {
    Intl.DateTimeFormat('pl-PL', { timeZone: zone })
    return true
  } catch {
    return false
  }
}

function partsOf(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const map: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value
  }
  let hour = Number(map.hour)
  if (hour === 24) hour = 0
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
    millisecond: date.getUTCMilliseconds(),
  }
}

function offsetMs(date: Date, timeZone: string): number {
  const parts = partsOf(date, timeZone)
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  )
  return asUtc - date.getTime()
}

function sameWall(date: Date, parts: ZonedParts, timeZone: string): boolean {
  const wall = partsOf(date, timeZone)
  return (
    wall.year === parts.year &&
    wall.month === parts.month &&
    wall.day === parts.day &&
    wall.hour === parts.hour &&
    wall.minute === parts.minute &&
    wall.second === parts.second &&
    wall.millisecond === parts.millisecond
  )
}

function isRealDate(parts: ZonedParts): boolean {
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  return (
    probe.getUTCFullYear() === parts.year &&
    probe.getUTCMonth() === parts.month - 1 &&
    probe.getUTCDate() === parts.day
  )
}

function resolveWall(parts: ZonedParts, timeZone: string): Result<{ date: Date; ambiguous: boolean }> {
  if (parts.month < 1 || parts.month > 12 || !isRealDate(parts)) return err('Ta data nie istnieje.')
  if (parts.hour > 23 || parts.minute > 59 || parts.second > 59 || parts.millisecond > 999) {
    return err('Niepoprawna godzina.')
  }
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  )
  const base = offsetMs(new Date(localAsUtc), timeZone)
  const offsets = new Set<number>()
  for (const shift of [-14, -2, -1, 0, 1, 2, 14]) {
    offsets.add(offsetMs(new Date(localAsUtc - base + shift * 3_600_000), timeZone))
  }
  const matches = new Set<number>()
  for (const offset of offsets) {
    const instant = localAsUtc - offset
    if (sameWall(new Date(instant), parts, timeZone)) matches.add(instant)
  }
  if (matches.size === 0) return err(`Ta lokalna godzina nie istnieje w strefie ${timeZone} (przeskok czasu).`)
  const sorted = [...matches].sort((left, right) => left - right)
  const earliest = sorted[0]
  if (earliest === undefined) return err('Nie udało się ustalić chwili.')
  return ok({ date: new Date(earliest), ambiguous: sorted.length > 1 })
}

function formatLocal(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).format(date)
}

function viewFromDate(date: Date, timeZone: string, ambiguous: boolean): Result<UnixView> {
  if (Number.isNaN(date.getTime())) return err('Data jest poza zakresem.')
  let isoUtc: string
  try {
    isoUtc = date.toISOString()
  } catch {
    return err('Data jest poza zakresem.')
  }
  return ok({
    seconds: date.getTime() / 1000,
    milliseconds: date.getTime(),
    isoUtc,
    timeZone,
    local: formatLocal(date, timeZone),
    parts: partsOf(date, timeZone),
    ambiguous,
  })
}

function requireZone(timeZone: string | undefined): Result<string> {
  const zone = (timeZone ?? DEFAULT_TIME_ZONE).trim()
  if (!isValidTimeZone(zone)) return err('Nieznana strefa czasowa.')
  return ok(zone)
}

export function unixToZoned(
  input: string,
  options: { unit?: UnixUnit; timeZone?: string } = {},
): Result<UnixView> {
  const zone = requireZone(options.timeZone)
  if (!zone.ok) return zone
  const raw = input.trim()
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(raw)) return err('Znacznik Unix musi być liczbą.')
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return err('Znacznik Unix jest poza zakresem.')
  const unit = options.unit ?? 'auto'
  let milliseconds: number
  if (unit === 'milliseconds') milliseconds = Math.round(numeric)
  else if (unit === 'seconds') milliseconds = Math.round(numeric * 1000)
  else if (raw.includes('.')) milliseconds = Math.round(numeric * 1000)
  else if (Math.abs(numeric) >= 1e12) milliseconds = Math.round(numeric)
  else milliseconds = Math.round(numeric * 1000)
  return viewFromDate(new Date(milliseconds), zone.value, false)
}

function millisecondsFromFraction(fraction: string | undefined): number {
  if (!fraction) return 0
  return Number(fraction.padEnd(3, '0').slice(0, 3))
}

function partsFromMatch(match: RegExpMatchArray): ZonedParts {
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] === undefined ? 0 : Number(match[4]),
    minute: match[5] === undefined ? 0 : Number(match[5]),
    second: match[6] === undefined ? 0 : Number(match[6]),
    millisecond: millisecondsFromFraction(match[7]),
  }
}

const WITH_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})$/
const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/

export function zonedToUnix(input: string, options: { timeZone?: string } = {}): Result<UnixView> {
  const zone = requireZone(options.timeZone)
  if (!zone.ok) return zone
  const raw = input.trim()
  if (raw === '') return err('Podaj datę.')
  const offsetMatch = WITH_OFFSET.exec(raw)
  if (offsetMatch) {
    const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw
    const withColon = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
    const date = new Date(withColon)
    if (Number.isNaN(date.getTime())) return err('Niepoprawna data ze strefą.')
    return viewFromDate(date, zone.value, false)
  }
  const wall = WALL_CLOCK.exec(raw)
  if (!wall) return err('Użyj formatu RRRR-MM-DD lub RRRR-MM-DD GG:mm:ss.')
  const resolved = resolveWall(partsFromMatch(wall), zone.value)
  if (!resolved.ok) return resolved
  const view = viewFromDate(resolved.value.date, zone.value, resolved.value.ambiguous)
  if (!view.ok) return view
  return ok({ ...view.value, ambiguous: resolved.value.ambiguous })
}

export function currentUnixView(timeZone = DEFAULT_TIME_ZONE): Result<UnixView> {
  const zone = requireZone(timeZone)
  if (!zone.ok) return zone
  return viewFromDate(new Date(), zone.value, false)
}
