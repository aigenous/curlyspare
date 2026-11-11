import { describe, expect, it } from 'vitest'
import { explainCron } from './cron'

describe('cron explainer', () => {
  it('describes a weekday office schedule in Polish', () => {
    const result = explainCron('*/15 9-17 * * 1-5', new Date('2026-11-11T12:00:00Z'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary).toBe(
      'Co 15 minut, w godzinach od 9 do 17, każdego dnia miesiąca, w każdym miesiącu, od poniedziałku do piątku.',
    )
    expect(result.runs).toHaveLength(5)
    expect(result.runs[0]).toBe('2026-11-11 13:15, środa')
    expect(result.runs.every((run) => !run.includes('sobota') && !run.includes('niedziela'))).toBe(true)
  })

  it('uses either the day of month or the weekday when both are set', () => {
    const result = explainCron('0 0 1 * MON', new Date('2026-11-11T00:00:00Z'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary).toContain('Dzień miesiąca albo dzień tygodnia wystarcza.')
    expect(result.runs.some((run) => run.startsWith('2026-12-01'))).toBe(true)
    expect(result.runs.some((run) => run.includes('poniedziałek'))).toBe(true)
  })

  it('rejects a broken expression and a date that never happens', () => {
    expect(explainCron('nie cron').ok).toBe(false)
    expect(explainCron('0 0 31 2 *').ok).toBe(false)
    expect(explainCron('60 * * * *').ok).toBe(false)
  })
})
