import {
  ID_CARD_CHECK_INDEX,
  ID_CARD_WEIGHTS,
  validateIdCardNumber,
} from '../../lib/generators/id-card'
import type { ChecksumAnatomy, RevealLevel } from './types'
import { ID_CARD_ANATOMY_SLUG } from './types'
import { ID_CARD_DETAIL, ID_CARD_MISMATCH } from './copy'
import { documentAnatomy } from './document'
import type { InputShape } from './parse'

/**
 * ID card numbers stop at level 2 when the check fails:
 * characters, letter values, weights and products, with no total and no remainder.
 */
export function idCardRevealLevel(input: {
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

export function idCardAnatomy(input: string): ChecksumAnatomy {
  return documentAnatomy(input, {
    slug: ID_CARD_ANATOMY_SLUG,
    seriesLength: 3,
    checkIndex: ID_CARD_CHECK_INDEX,
    weights: ID_CARD_WEIGHTS,
    pattern: /^[A-Z]{3}\d{6}$/,
    mismatch: ID_CARD_MISMATCH,
    detail: ID_CARD_DETAIL,
    reveal: idCardRevealLevel,
    agrees: (value) => validateIdCardNumber(value).valid,
  })
}
