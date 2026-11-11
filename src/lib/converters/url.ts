import { assertNever, err, ok, type Result } from './result'

export type UrlEncoding = 'component' | 'uri' | 'form'

export function encodeUrl(input: string, mode: UrlEncoding = 'component'): Result<string> {
  switch (mode) {
    case 'component':
      return ok(encodeURIComponent(input))
    case 'uri':
      return ok(encodeURI(input))
    case 'form':
      return ok(encodeURIComponent(input).replaceAll('%20', '+'))
    default:
      return assertNever(mode)
  }
}

export function decodeUrl(input: string, mode: UrlEncoding = 'component'): Result<string> {
  try {
    switch (mode) {
      case 'component':
        return ok(decodeURIComponent(input))
      case 'uri':
        return ok(decodeURI(input))
      case 'form':
        return ok(decodeURIComponent(input.replaceAll('+', ' ')))
      default:
        return assertNever(mode)
    }
  } catch {
    return err('Niepoprawne kodowanie procentowe.')
  }
}
