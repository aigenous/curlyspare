declare module 'sql-formatter' {
  export type SqlLanguage =
    | 'sql'
    | 'postgresql'
    | 'mysql'
    | 'mariadb'
    | 'sqlite'
    | 'transactsql'
    | 'plsql'

  export function format(
    query: string,
    options?: {
      language?: SqlLanguage
      tabWidth?: number
      keywordCase?: 'preserve' | 'upper' | 'lower'
    },
  ): string
}
