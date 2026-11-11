import { parseCsv, type CsvDelimiter } from './csv'
import { err, ok, type Result } from './result'

function cell(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\r\n', '<br>').replaceAll('\n', '<br>')
}

export function csvToMarkdown(input: string, delimiter: CsvDelimiter = ','): Result<string> {
  const parsed = parseCsv(input, delimiter)
  if (!parsed.ok) return parsed
  const rows = parsed.value.filter((row, index) => !(index === parsed.value.length - 1 && row.length === 1 && row[0] === ''))
  if (rows.length === 0) return err('Pusty CSV nie tworzy tabeli.')
  const header = rows[0] ?? []
  if (header.length === 0) return err('CSV nie ma kolumn.')
  const width = header.length
  const line = (row: string[]): string => `| ${Array.from({ length: width }, (_, index) => cell(row[index] ?? '')).join(' | ')} |`
  const separator = `| ${Array.from({ length: width }, () => '---').join(' | ')} |`
  return ok(`${[line(header), separator, ...rows.slice(1).map((row) => line(row))].join('\n')}\n`)
}
