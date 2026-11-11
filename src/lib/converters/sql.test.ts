import { describe, expect, it } from 'vitest'
import { formatSql } from './sql'

const query = 'select a, b from users where id = 1 and name = \'Ala\' order by a'

describe('sql', () => {
  it('formats PostgreSQL keywords and clauses', () => {
    expect(formatSql(query, 'postgresql')).toEqual({
      ok: true,
      value: 'SELECT\n  a,\n  b\nFROM\n  users\nWHERE\n  id = 1\n  AND name = \'Ala\'\nORDER BY\n  a\n',
    })
  })

  it('keeps the chosen dialect, including MySQL and PL/SQL', () => {
    const mysql = formatSql('select id from t limit 5', 'mysql')
    const plsql = formatSql(query, 'plsql')
    const postgres = formatSql(query, 'postgresql')
    expect(mysql.ok && mysql.value).toContain('LIMIT\n  5')
    expect(plsql.ok && plsql.value).toContain('AND NAME =')
    expect(postgres.ok && postgres.value).toContain('AND name =')
  })

  it('rejects an empty query and a broken statement', () => {
    expect(formatSql('   ', 'sqlite').ok).toBe(false)
    expect(formatSql('select (((', 'transactsql').ok).toBe(false)
  })
})
