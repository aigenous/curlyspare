import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

export const CSV_DELIMITERS = [',', ';', '\t'] as const
export type CsvDelimiter = (typeof CSV_DELIMITERS)[number]

export interface CsvOptions {
  delimiter?: CsvDelimiter
  header?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function delimiterOf(value: CsvDelimiter | undefined): Result<CsvDelimiter> {
  const delimiter = value ?? ','
  if (delimiter === ',' || delimiter === ';' || delimiter === '\t') return ok(delimiter)
  return err('Separator CSV to przecinek, średnik albo tabulator.')
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return JSON.stringify(value)
}

function escapeCell(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes('\n') || value.includes('\r') || value.includes(delimiter)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function rowsFromObjects(records: Record<string, unknown>[]): Result<string[][]> {
  const headers: string[] = []
  const seen = new Set<string>()
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (seen.has(key)) continue
      seen.add(key)
      headers.push(key)
    }
  }
  if (headers.length === 0) return err('Obiekty JSON nie mają pól do zapisania jako CSV.')
  const rows = [headers]
  for (const record of records) rows.push(headers.map((key) => cellText(record[key])))
  return ok(rows)
}

function rowsFromArrays(records: unknown[][]): string[][] {
  return records.map((record) => record.map((value) => cellText(value)))
}

export function jsonToCsv(input: string, options: { delimiter?: CsvDelimiter } = {}): Result<string> {
  const delimiter = delimiterOf(options.delimiter)
  if (!delimiter.ok) return delimiter
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  let rows: string[][]
  if (isRecord(parsed.value)) {
    const built = rowsFromObjects([parsed.value])
    if (!built.ok) return built
    rows = built.value
  } else if (Array.isArray(parsed.value)) {
    if (parsed.value.length === 0) return err('Pusta tablica nie zawiera kolumn CSV.')
    if (parsed.value.every((item) => isRecord(item))) {
      const built = rowsFromObjects(parsed.value as Record<string, unknown>[])
      if (!built.ok) return built
      rows = built.value
    } else if (parsed.value.every((item) => Array.isArray(item))) {
      rows = rowsFromArrays(parsed.value as unknown[][])
    } else {
      return err('Tablica JSON musi zawierać albo obiekty, albo tablice.')
    }
  } else {
    return err('Oczekiwano obiektu JSON albo tablicy.')
  }
  const text = rows.map((row) => row.map((value) => escapeCell(value, delimiter.value)).join(delimiter.value)).join('\n')
  return ok(`${text}\n`)
}

export function parseCsv(input: string, delimiter: CsvDelimiter = ','): Result<string[][]> {
  const chosen = delimiterOf(delimiter)
  if (!chosen.ok) return chosen
  const separator = chosen.value
  const text = input.replace(/^\uFEFF/, '')
  if (text === '') return ok([])
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? ''
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
          continue
        }
        inQuotes = false
        continue
      }
      field += char
      continue
    }
    if (char === '"') {
      if (field !== '') return err('CSV: cudzysłów w środku pola.')
      inQuotes = true
      continue
    }
    if (char === separator) {
      row.push(field)
      field = ''
      continue
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }
    field += char
  }
  if (inQuotes) return err('CSV: niezakończony cudzysłów.')
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return ok(rows)
}

export function csvToJson(input: string, options: CsvOptions = {}): Result<string> {
  const delimiter = delimiterOf(options.delimiter)
  if (!delimiter.ok) return delimiter
  const parsed = parseCsv(input, delimiter.value)
  if (!parsed.ok) return parsed
  const rows = parsed.value.filter((row, index) => !(index === parsed.value.length - 1 && row.length === 1 && row[0] === ''))
  if (rows.length === 0) return ok('[]\n')
  if (options.header === false) return ok(`${JSON.stringify(rows, null, 2)}\n`)
  const headers = rows[0] ?? []
  if (headers.length === 0 || headers.some((header) => header === '')) return err('CSV: pusty nagłówek.')
  const seen = new Set<string>()
  for (const header of headers) {
    if (seen.has(header)) return err(`CSV: powtórzony nagłówek „${header}”.`)
    seen.add(header)
  }
  const objects = rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = row[index] ?? ''
    })
    return record
  })
  return ok(`${JSON.stringify(objects, null, 2)}\n`)
}
