import { format, type SqlLanguage } from 'sql-formatter'
import { assertNever, err, ok, type Result } from './result'

export const SQL_DIALECTS = ['postgresql', 'mysql', 'mariadb', 'sqlite', 'transactsql', 'plsql', 'sql'] as const
export type SqlDialect = (typeof SQL_DIALECTS)[number]

export function isSqlDialect(value: string): value is SqlDialect {
  return (SQL_DIALECTS as readonly string[]).includes(value)
}

function languageOf(dialect: SqlDialect): SqlLanguage {
  switch (dialect) {
    case 'postgresql':
    case 'mysql':
    case 'mariadb':
    case 'sqlite':
    case 'transactsql':
    case 'plsql':
    case 'sql':
      return dialect
    default:
      return assertNever(dialect)
  }
}

export function formatSql(input: string, dialect: SqlDialect): Result<string> {
  if (input.trim() === '') return err('Wklej zapytanie SQL.')
  try {
    const formatted = format(input, { language: languageOf(dialect), tabWidth: 2, keywordCase: 'upper' })
    return ok(formatted.endsWith('\n') ? formatted : `${formatted}\n`)
  } catch {
    return err('Nie udało się sformatować SQL. Sprawdź składnię wybranego dialektu.')
  }
}
