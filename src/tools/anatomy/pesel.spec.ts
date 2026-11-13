import { describe, expect, it } from 'vitest'
import { validatePesel } from '../../lib/generators/pesel'
import { peselAnatomy } from './pesel'
import { PESEL_ANATOMY_SLUG } from './types'

describe('PESEL anatomy', () => {
  it('renders an empty skeleton with the three segments', () => {
    const anatomy = peselAnatomy('')
    expect(anatomy.slug).toBe(PESEL_ANATOMY_SLUG)
    expect(anatomy.slug).toBe('generator-pesel')
    expect(anatomy.complete).toBe(false)
    expect(anatomy.valid).toBe(false)
    expect(anatomy.steps).toEqual([])
    expect(anatomy.parts).toEqual([
      { from: 0, to: 6, labelKey: 'birth-date', role: 'data' },
      { from: 6, to: 10, labelKey: 'serial-and-sex', role: 'serial' },
      { from: 10, to: 11, labelKey: 'check', role: 'check' },
    ])
    expect(anatomy.cells).toHaveLength(11)
    expect(anatomy.cells.every((cell) => cell.state === 'empty' && cell.char === '')).toBe(true)
  })

  it('fills cells as digits arrive and withholds the sum before the tenth', () => {
    const anatomy = peselAnatomy('44051')
    expect(anatomy.complete).toBe(false)
    expect(anatomy.steps).toEqual([])
    expect(anatomy.cells.slice(0, 5).map((cell) => cell.char)).toEqual(['4', '4', '0', '5', '1'])
    expect(anatomy.cells.slice(0, 5).every((cell) => cell.state === 'filled')).toBe(true)
    expect(anatomy.cells.slice(5).every((cell) => cell.state === 'empty')).toBe(true)
  })

  it('shows the weighted sum once ten digits are present', () => {
    const anatomy = peselAnatomy('4405140135')
    expect(anatomy.complete).toBe(false)
    expect(anatomy.cells[10]?.state).toBe('empty')
    expect(anatomy.steps).toEqual([
      {
        kind: 'weighted-sum',
        terms: [
          { weight: 1, value: 4 },
          { weight: 3, value: 4 },
          { weight: 7, value: 0 },
          { weight: 9, value: 5 },
          { weight: 1, value: 1 },
          { weight: 3, value: 4 },
          { weight: 7, value: 0 },
          { weight: 9, value: 1 },
          { weight: 1, value: 3 },
          { weight: 3, value: 5 },
        ],
        sum: 101,
        modulus: 10,
        formula: 'mod10-complement',
        actual: null,
        matches: null,
      },
    ])
  })

  it('marks the check digit of a valid number, including spaced input', () => {
    const anatomy = peselAnatomy('44 051-401 359')
    expect(anatomy.complete).toBe(true)
    expect(anatomy.valid).toBe(true)
    expect(anatomy.valid).toBe(validatePesel('44051401359').valid)
    expect(anatomy.cells[10]).toMatchObject({ char: '9', state: 'check-ok' })
    expect(anatomy.cells.slice(0, 10).every((cell) => cell.state === 'filled')).toBe(true)
    expect(anatomy.steps[0]).toMatchObject({ sum: 101, actual: '9', matches: true })
    expect(anatomy.steps[0]).not.toHaveProperty('expected')
  })

  it('flags only the check digit when the date is real and the sum is not', () => {
    const anatomy = peselAnatomy('44051401358')
    expect(anatomy.valid).toBe(false)
    expect(anatomy.cells.slice(0, 6).every((cell) => cell.state === 'filled')).toBe(true)
    expect(anatomy.cells[10]).toMatchObject({ char: '8', state: 'bad' })
    expect(anatomy.steps[0]).toMatchObject({ actual: '8', matches: false })
    expect(anatomy.steps[0]).not.toHaveProperty('expected')
    expect(JSON.stringify(anatomy)).not.toContain('"expected"')
  })

  it('flags the birth-date cells when the day cannot exist', () => {
    const anatomy = peselAnatomy('00022900003')
    expect(anatomy.complete).toBe(true)
    expect(anatomy.valid).toBe(false)
    expect(anatomy.cells.slice(0, 6).every((cell) => cell.state === 'bad')).toBe(true)
    expect(anatomy.cells[10]).toMatchObject({ char: '3', state: 'check-ok' })
  })

  it('flags both the date and the check digit when each fails', () => {
    const anatomy = peselAnatomy('00022900004')
    expect(anatomy.cells.slice(0, 6).every((cell) => cell.state === 'bad')).toBe(true)
    expect(anatomy.cells[10]?.state).toBe('bad')
    expect(anatomy.valid).toBe(false)
  })

  it('keeps extra digits and does not call the number valid', () => {
    const anatomy = peselAnatomy('4405140135999')
    expect(anatomy.complete).toBe(false)
    expect(anatomy.valid).toBe(false)
    expect(anatomy.cells).toHaveLength(13)
    expect(anatomy.cells.slice(11).every((cell) => cell.state === 'bad')).toBe(true)
    expect(anatomy.cells.slice(0, 11).every((cell) => cell.state === 'filled')).toBe(true)
    expect(anatomy.parts[2]).toEqual({ from: 10, to: 13, labelKey: 'check', role: 'check' })
  })
})
