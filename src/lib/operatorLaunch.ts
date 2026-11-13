import { site, type OperatorDetails } from '../site'

const placeholderToken = /\[[^[\]]+\]/

/** Fields whose values still contain a Lawyer placeholder such as [ADRES]. */
export function operatorPlaceholderFields(operator: OperatorDetails): string[] {
  return Object.entries(operator)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && placeholderToken.test(entry[1]))
    .map(([key]) => key)
}

/**
 * Bracket tokens left in legal markdown after operator substitution.
 * HTML comments, markdown links, and the quoted `[TEST]` marker are copy, not fill-in tokens.
 */
export function legalPlaceholderTokens(markdown: string): string[] {
  const visible = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[[^[\]]+\]\([^)\n]*\)/g, '')
    .replaceAll('[TEST]', '')
  return [...new Set(visible.match(/\[[^[\]]+\]/g) ?? [])]
}

/**
 * REQUIRE_OPERATOR_DATA is a build-time process env, not a VITE_ variable.
 * When it is 1, placeholders in operator fields or in the legal pages fail the build.
 * Otherwise every build warns and passes.
 */
export function assertOperatorReadyForLaunch(
  operator: OperatorDetails,
  requireOperatorData: string | undefined,
  warn: (message: string) => void = console.warn,
  legalDocuments: readonly string[] = [],
): void {
  const fields = operatorPlaceholderFields(operator)
  const tokens = [
    ...new Set(legalDocuments.flatMap((source) => legalPlaceholderTokens(applyOperatorFields(source, operator)))),
  ]
  if (fields.length === 0 && tokens.length === 0) return
  const details = [
    fields.length > 0 ? `operator fields (${fields.join(', ')})` : '',
    tokens.length > 0 ? `legal pages (${tokens.join(', ')})` : '',
  ].filter((part) => part.length > 0)
  const message = `Operator data still has placeholders in ${details.join(' and ')}. Replace them before REQUIRE_OPERATOR_DATA=1.`
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
