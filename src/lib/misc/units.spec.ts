import { describe, expect, it } from 'vitest'
import { convertData } from './units'

describe('data unit conversion', () => {
  it('converts decimal and binary units through whole bytes', () => {
    const result = convertData('1,5', 'KiB')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values.find((item) => item.id === 'B')?.text).toBe('1536')
    expect(result.values.find((item) => item.id === 'KiB')?.text).toBe('1,5')
    expect(result.values.find((item) => item.id === 'KB')?.text).toBe('1,536')
  })

  it('rejects a negative or empty amount', () => {
    expect(convertData('-1', 'MB').ok).toBe(false)
    expect(convertData('gb', 'GB').ok).toBe(false)
  })
})
