const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const monthLocative = [
  'styczniu',
  'lutym',
  'marcu',
  'kwietniu',
  'maju',
  'czerwcu',
  'lipcu',
  'sierpniu',
  'wrześniu',
  'październiku',
  'listopadzie',
  'grudniu',
]
const weekdayPlural = ['niedziele', 'poniedziałki', 'wtorki', 'środy', 'czwartki', 'piątki', 'soboty']
const weekdayNominative = [
  'niedziela',
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
]

interface Field {
  values: Set<number>
  any: boolean
}

interface Schedule {
  minute: Field
  hour: Field
  day: Field
  month: Field
  weekday: Field
}

interface Civil {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

export interface CronExplanation {
  summary: string
  runs: string[]
}

export function explainCron(
  expression: string,
  from = new Date(),
  count = 5,
): { ok: true; summary: string; runs: string[] } | { ok: false; error: string } {
  const schedule = parseCron(expression)
  if (!schedule) return { ok: false, error: 'Wyrażenie cron ma mieć pięć pól: minuta godzina dzień miesiąc dzień-tygodnia.' }
  const runs = upcoming(schedule, warsawCivil(from), count)
  if (runs.length < count) {
    return { ok: false, error: 'Nie udało się znaleźć pięciu kolejnych uruchomień w ciągu dwóch lat.' }
  }
  return { ok: true, summary: summarize(schedule), runs: runs.map(formatRun) }
}

function parseCron(expression: string): Schedule | null {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== 5) return null
  const minute = parseField(fields[0] ?? '', 0, 59)
  const hour = parseField(fields[1] ?? '', 0, 23)
  const day = parseField(fields[2] ?? '', 1, 31)
  const month = parseField(fields[3] ?? '', 1, 12, monthNames)
  const weekday = parseField(fields[4] ?? '', 0, 7, dayNames)
  if (!minute || !hour || !day || !month || !weekday) return null
  if (weekday.values.has(7)) {
    weekday.values.delete(7)
    weekday.values.add(0)
  }
  weekday.any = weekday.values.size === 7
  return { minute, hour, day, month, weekday }
}

function parseField(field: string, min: number, max: number, names?: readonly string[]): Field | null {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    const [span, stepText] = part.split('/')
    if (!span || part.split('/').length > 2) return null
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step <= 0) return null
    if (span === '*') {
      addRange(values, min, max, step)
      continue
    }
    if (span.includes('-')) {
      const [startText, endText] = span.split('-')
      const start = tokenValue(startText ?? '', names)
      const end = tokenValue(endText ?? '', names)
      if (start === null || end === null || start > end || start < min || end > max) return null
      addRange(values, start, end, step)
      continue
    }
    const value = tokenValue(span, names)
    if (value === null || value < min || value > max) return null
    if (stepText === undefined) values.add(value)
    else addRange(values, value, max, step)
  }
  if (values.size === 0) return null
  const any = spanSize(min, max) === values.size && [...values].every((value) => value >= min && value <= max)
  return { values, any }
}

function addRange(values: Set<number>, start: number, end: number, step: number) {
  for (let value = start; value <= end; value += step) values.add(value)
}

function spanSize(min: number, max: number): number {
  return max - min + 1
}

function tokenValue(token: string, names?: readonly string[]): number | null {
  if (/^\d+$/.test(token)) return Number(token)
  if (!names) return null
  const index = names.indexOf(token.toLowerCase())
  if (index < 0) return null
  return names === monthNames ? index + 1 : index
}

function summarize(schedule: Schedule): string {
  const parts = [
    describeMinutes(schedule.minute),
    describeHours(schedule.hour),
    schedule.day.any ? 'każdego dnia miesiąca' : `w dniach miesiąca ${joinNumbers([...schedule.day.values])}`,
    schedule.month.any
      ? 'w każdym miesiącu'
      : `w ${joinWords([...schedule.month.values].sort((a, b) => a - b).map((month) => monthLocative[month - 1] ?? ''))}`,
    describeWeekdays(schedule.weekday),
  ]
  const sentence = `${parts.join(', ')}.`
  const alternative =
    !schedule.day.any && !schedule.weekday.any ? ' Dzień miesiąca albo dzień tygodnia wystarcza.' : ''
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + alternative
}

function describeMinutes(field: Field): string {
  if (field.any) return 'w każdej minucie'
  const values = [...field.values].sort((a, b) => a - b)
  const step = evenStep(values, 0, 59)
  if (step) return `co ${step} ${minuteWord(step)}`
  if (values.length === 1) return `w minucie ${values[0]}`
  return `w minutach ${joinNumbers(values)}`
}

function minuteWord(step: number): string {
  const tail = step % 100
  if (tail < 12 || tail > 14) {
    const last = step % 10
    if (last >= 2 && last <= 4) return 'minuty'
  }
  return 'minut'
}

function describeHours(field: Field): string {
  if (field.any) return 'o każdej godzinie'
  const values = [...field.values].sort((a, b) => a - b)
  if (values.length === 1) return `o godzinie ${values[0]}`
  if (isContiguous(values)) return `w godzinach od ${values[0]} do ${values[values.length - 1]}`
  return `o godzinach ${joinNumbers(values)}`
}

function describeWeekdays(field: Field): string {
  if (field.any) return 'każdego dnia tygodnia'
  const values = [...field.values].sort((a, b) => a - b)
  if (values.join() === '1,2,3,4,5') return 'od poniedziałku do piątku'
  if (values.join() === '0,6') return 'w soboty i niedziele'
  return `w ${joinWords(values.map((day) => weekdayPlural[day] ?? ''))}`
}

function evenStep(values: number[], min: number, max: number): number | null {
  if (values.length < 2 || values[0] !== min) return null
  const step = (values[1] ?? 0) - (values[0] ?? 0)
  if (step <= 1) return null
  const expected: number[] = []
  for (let value = min; value <= max; value += step) expected.push(value)
  return expected.length === values.length && expected.every((value, index) => value === values[index]) ? step : null
}

function isContiguous(values: number[]): boolean {
  return values.every((value, index) => index === 0 || value === (values[index - 1] ?? 0) + 1)
}

function joinNumbers(values: number[]): string {
  return joinWords(values.map(String))
}

function joinWords(values: string[]): string {
  if (values.length <= 1) return values[0] ?? ''
  return `${values.slice(0, -1).join(', ')} i ${values[values.length - 1]}`
}

function upcoming(schedule: Schedule, start: Civil, count: number): Civil[] {
  const runs: Civil[] = []
  let cursor = addDays(start, 0)
  cursor = addMinute(cursor)
  for (let guard = 0; runs.length < count && guard < 800; guard += 1) {
    if (!schedule.month.values.has(cursor.month)) {
      cursor = { year: cursor.month === 12 ? cursor.year + 1 : cursor.year, month: cursor.month === 12 ? 1 : cursor.month + 1, day: 1, hour: 0, minute: 0, weekday: 0 }
      cursor.weekday = weekdayOf(cursor)
      continue
    }
    if (!dayMatches(schedule, cursor)) {
      cursor = addDays(cursor, 1)
      continue
    }
    const hours = [...schedule.hour.values].sort((a, b) => a - b)
    const minutes = [...schedule.minute.values].sort((a, b) => a - b)
    for (const hour of hours) {
      if (hour < cursor.hour) continue
      for (const minute of minutes) {
        if (hour === cursor.hour && minute < cursor.minute) continue
        const candidate = { ...cursor, hour, minute }
        if (existsInWarsaw(candidate)) runs.push(candidate)
        if (runs.length === count) return runs
      }
    }
    cursor = addDays(cursor, 1)
  }
  return runs
}

function dayMatches(schedule: Schedule, civil: Civil): boolean {
  const day = schedule.day.values.has(civil.day)
  const weekday = schedule.weekday.values.has(civil.weekday)
  if (schedule.day.any && schedule.weekday.any) return true
  if (schedule.day.any) return weekday
  if (schedule.weekday.any) return day
  return day || weekday
}

function addMinute(civil: Civil): Civil {
  if (civil.minute < 59) return { ...civil, minute: civil.minute + 1 }
  if (civil.hour < 23) return { ...civil, hour: civil.hour + 1, minute: 0 }
  return addDays({ ...civil, hour: 0, minute: 0 }, 1)
}

function addDays(civil: Civil, days: number): Civil {
  const date = new Date(Date.UTC(civil.year, civil.month - 1, civil.day + days))
  const next = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: days === 0 ? civil.hour : 0,
    minute: days === 0 ? civil.minute : 0,
    weekday: date.getUTCDay(),
  }
  return next
}

function weekdayOf(civil: Civil): number {
  return new Date(Date.UTC(civil.year, civil.month - 1, civil.day)).getUTCDay()
}

function existsInWarsaw(civil: Civil): boolean {
  for (const offset of [1, 2]) {
    const utc = new Date(Date.UTC(civil.year, civil.month - 1, civil.day, civil.hour - offset, civil.minute))
    const back = warsawCivil(utc)
    if (
      back.year === civil.year &&
      back.month === civil.month &&
      back.day === civil.day &&
      back.hour === civil.hour &&
      back.minute === civil.minute
    ) {
      return true
    }
  }
  return false
}

function warsawCivil(date: Date): Civil {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const hour = Number(value('hour'))
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    hour: hour === 24 ? 0 : hour,
    minute: Number(value('minute')),
    weekday: weekdays[value('weekday')] ?? 0,
  }
}

function formatRun(civil: Civil): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${civil.year}-${pad(civil.month)}-${pad(civil.day)} ${pad(civil.hour)}:${pad(civil.minute)}, ${weekdayNominative[civil.weekday]}`
}
