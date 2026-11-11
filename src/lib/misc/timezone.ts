export const commonTimeZones = [
  'Europe/Warsaw',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
] as const

export interface ZonedTime {
  zone: string
  date: string
  time: string
  offset: string
}

export function isTimeZone(value: string): boolean {
  if (!value.trim()) return false
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function convertTimeZone(
  dateText: string,
  timeText: string,
  fromZone: string,
  toZone: string,
): { ok: true; source: ZonedTime; target: ZonedTime; note: string } | { ok: false; error: string } {
  if (!isTimeZone(fromZone) || !isTimeZone(toZone)) {
    return { ok: false, error: 'Nieznana strefa czasowa. Użyj nazwy IANA, na przykład Europe/Warsaw.' }
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim())
  const time = /^(\d{2}):(\d{2})$/.exec(timeText.trim())
  if (!match || !time) return { ok: false, error: 'Podaj datę i godzinę.' }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(time[1])
  const minute = Number(time[2])
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    return { ok: false, error: 'Data albo godzina jest niepoprawna.' }
  }
  const resolved = zonedToUtc(year, month, day, hour, minute, fromZone)
  if (resolved.missing) return { ok: false, error: 'Tej godziny nie ma w strefie źródłowej, bo zegary zostały przesunięte.' }
  const target = stamp(resolved.utc, toZone)
  return {
    ok: true,
    source: stamp(resolved.utc, fromZone),
    target,
    note: resolved.ambiguous ? 'Ta godzina występuje dwukrotnie. Pokazano wcześniejsze wystąpienie.' : '',
  }
}

function zonedToUtc(year: number, month: number, day: number, hour: number, minute: number, zone: string) {
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const first = offsetMinutes(new Date(wall), zone)
  const second = offsetMinutes(new Date(wall - first * 60_000), zone)
  const utc = new Date(wall - second * 60_000)
  const back = parts(utc, zone)
  const matches =
    back.year === year && back.month === month && back.day === day && back.hour === hour && back.minute === minute
  if (!matches) return { utc, missing: true, ambiguous: false }
  const other = new Date(wall - first * 60_000)
  const otherParts = parts(other, zone)
  const otherMatches =
    otherParts.year === year &&
    otherParts.month === month &&
    otherParts.day === day &&
    otherParts.hour === hour &&
    otherParts.minute === minute
  return { utc: other.getTime() < utc.getTime() && otherMatches ? other : utc, missing: false, ambiguous: otherMatches && first !== second }
}

function stamp(utc: Date, zone: string): ZonedTime {
  const value = parts(utc, zone)
  const offset = offsetMinutes(utc, zone)
  return {
    zone,
    date: `${value.year}-${pad(value.month)}-${pad(value.day)}`,
    time: `${pad(value.hour)}:${pad(value.minute)}`,
    offset: formatOffset(offset),
  }
}

function parts(utc: Date, zone: string) {
  const list = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utc)
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(list.find((part) => part.type === type)?.value ?? '0')
  const hour = read('hour')
  return { year: read('year'), month: read('month'), day: read('day'), hour: hour === 24 ? 0 : hour, minute: read('minute') }
}

function offsetMinutes(utc: Date, zone: string): number {
  const value = parts(utc, zone)
  const asUtc = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute)
  return Math.round((asUtc - utc.getTime()) / 60_000)
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  return `UTC${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
