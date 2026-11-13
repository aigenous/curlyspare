import {
  PASSPORT_CHECK_INDEX,
  PASSPORT_WEIGHTS,
  validatePassport,
} from '../../lib/generators/passport'
import type { ChecksumAnatomy, RevealLevel } from './types'
import { PASSPORT_ANATOMY_SLUG } from './types'
import { PASSPORT_DETAIL, PASSPORT_MISMATCH } from './copy'
import { documentAnatomy } from './document'
import type { InputShape } from './parse'

/**
 * Passport numbers stop at level 2 when the check fails:
 * characters, letter values, weights and products, with no total and no remainder.
 */
export function passportRevealLevel(input: {
  shape: InputShape
  checksumMatches: boolean
}): RevealLevel {
  switch (input.shape) {
    case 'empty':
    case 'partial':
      return 'format-only'
    case 'unusable':
      return 'n/a'
    case 'complete':
      return input.checksumMatches ? 'full' : 'level2'
    default: {
      const unexpected: never = input.shape
      return unexpected
    }
  }
}

export function passportAnatomy(input: string): ChecksumAnatomy {
  return documentAnatomy(input, {
    slug: PASSPORT_ANATOMY_SLUG,
    seriesLength: 2,
    checkIndex: PASSPORT_CHECK_INDEX,
    weights: PASSPORT_WEIGHTS,
    pattern: /^[A-Z]{2}\d{7}$/,
    mismatch: PASSPORT_MISMATCH,
    detail: PASSPORT_DETAIL,
    reveal: passportRevealLevel,
    agrees: (value) => validatePassport(value).valid,
  })
}
