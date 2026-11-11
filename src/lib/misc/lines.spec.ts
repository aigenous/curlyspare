import { describe, expect, it } from 'vitest'
import { arrangeLines } from './lines'

describe('line sorting and duplicates', () => {
  it('trims, drops empty lines, removes duplicates, and sorts in Polish', () => {
    const result = arrangeLines(' żółć \n\nAla\nżółć\nala\n', {
      order: 'asc',
      unique: true,
      trim: true,
      dropEmpty: true,
    })
    expect(result).toEqual({ text: 'ala\nAla\nżółć', inputCount: 6, outputCount: 3 })
  })

  it('can sort descending without changing duplicates', () => {
    expect(arrangeLines('b\na\nb', { order: 'desc', unique: false, trim: false, dropEmpty: false }).text).toBe('b\nb\na')
  })
})
