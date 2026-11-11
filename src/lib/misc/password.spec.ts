import { describe, expect, it } from 'vitest'
import {
  cryptoRandomInt,
  entropyBits,
  entropyLevel,
  generatePassword,
  passwordAlphabet,
  type PasswordClasses,
} from './password'

const allOn: PasswordClasses = { lower: true, upper: true, digits: true, symbols: true }

describe('password generator', () => {
  it('builds the alphabet from the selected classes', () => {
    expect(passwordAlphabet({ lower: true, upper: false, digits: true, symbols: false })).toBe(
      'abcdefghijklmnopqrstuvwxyz0123456789',
    )
    expect(passwordAlphabet({ lower: false, upper: false, digits: false, symbols: false })).toBe('')
  })

  it('estimates entropy from length and alphabet size', () => {
    expect(entropyBits(16, 26)).toBe(75.2)
    expect(entropyBits(0, 26)).toBe(0)
    expect(entropyLevel(49.9)).toBe('niska')
    expect(entropyLevel(50)).toBe('umiarkowana')
    expect(entropyLevel(80)).toBe('wysoka')
  })

  it('rejects a missing class or a length that cannot cover every class', () => {
    const none: PasswordClasses = { lower: false, upper: false, digits: false, symbols: false }
    expect(generatePassword(12, none, () => 0)).toEqual({ ok: false, reason: 'classes' })
    expect(generatePassword(1, allOn, () => 0)).toEqual({ ok: false, reason: 'length' })
    expect(generatePassword(3, { ...allOn, symbols: false }, () => 0)).toEqual({
      ok: false,
      reason: 'length',
    })
  })

  it('uses the injected sampler and keeps one character from each class', () => {
    const result = generatePassword(4, { lower: true, upper: false, digits: true, symbols: false }, () => 0)
    expect(result).toEqual({ ok: true, password: '0aaa', bits: entropyBits(4, 36), level: 'niska' })
  })

  it('draws only from the selected alphabet when using crypto.getRandomValues', () => {
    const classes: PasswordClasses = { lower: true, upper: true, digits: false, symbols: false }
    const alphabet = passwordAlphabet(classes)
    const result = generatePassword(32, classes, cryptoRandomInt)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.password).toHaveLength(32)
    expect([...result.password].every((char) => alphabet.includes(char))).toBe(true)
    expect(result.password).toMatch(/[a-z]/)
    expect(result.password).toMatch(/[A-Z]/)
    expect(() => cryptoRandomInt(0)).toThrow(RangeError)
  })
})
