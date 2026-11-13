import { site, type OperatorDetails } from '../site'

const placeholderToken = /\[[^[\]]+\]/

/** Fields whose values still contain a Lawyer placeholder such as [ADRES]. */
export function operatorPlaceholderFields(operator: OperatorDetails): string[] {
  return Object.entries(operator)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && placeholderToken.test(entry[1]))
    .map(([key]) => key)
}

/**
 * REQUIRE_OPERATOR_DATA is a build-time process env, not a VITE_ variable.
 * When it is 1, placeholders fail the build. Otherwise every build warns and passes.
 */
export function assertOperatorReadyForLaunch(
  operator: OperatorDetails,
  requireOperatorData: string | undefined,
  warn: (message: string) => void = console.warn,
): void {
  const fields = operatorPlaceholderFields(operator)
  if (fields.length === 0) return
  const message = `Operator data still has placeholders (${fields.join(', ')}). Replace [ADRES] and [E-MAIL KONTAKTOWY] before REQUIRE_OPERATOR_DATA=1.`
  if (requireOperatorData === '1') {
    throw new Error(message)
  }
  warn(message)
}

/** Drop Lawyer's operator tokens into a legal draft. Other brackets, including [ADRES SERWISU], stay put. */
export function applyOperatorFields(source: string, operator: OperatorDetails = site.operator): string {
  return source
    .replaceAll('[E-MAIL KONTAKTOWY]', operator.email)
    .replaceAll('[ADRES]', operator.correspondenceAddress)
    .replaceAll('[REGON]', operator.regon)
}
