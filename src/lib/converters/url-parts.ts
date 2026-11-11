import { err, ok, type Result } from './result'

export interface QueryParam {
  key: string
  value: string
}

export interface ParsedUrl {
  protocol: string
  username: string
  password: string
  hostname: string
  port: string
  pathname: string
  hash: string
  params: QueryParam[]
}

export interface ParsedAddress {
  kind: 'url' | 'query'
  url: ParsedUrl | null
  params: QueryParam[]
}

function paramsFrom(search: URLSearchParams): QueryParam[] {
  const params: QueryParam[] = []
  search.forEach((value, key) => params.push({ key, value }))
  return params
}

export function encodeParams(params: QueryParam[]): string {
  const search = new URLSearchParams()
  for (const param of params) search.append(param.key, param.value)
  return search.toString()
}

function fromUrl(url: URL): ParsedUrl {
  return {
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    hash: url.hash,
    params: paramsFrom(url.searchParams),
  }
}

export function parseAddress(input: string): Result<ParsedAddress> {
  const trimmed = input.trim()
  if (trimmed === '') return err('Wklej adres URL albo parametry zapytania.')
  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const query = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed
    if (!trimmed.includes('://') && !trimmed.startsWith('//')) {
      return ok({ kind: 'query', url: null, params: paramsFrom(new URLSearchParams(query)) })
    }
  }
  try {
    const url = new URL(trimmed)
    const parts = fromUrl(url)
    return ok({ kind: 'url', url: parts, params: parts.params })
  } catch {
    return err('Niepoprawny adres URL.')
  }
}

export function buildUrl(parts: ParsedUrl): Result<string> {
  const protocol = parts.protocol.endsWith(':') ? parts.protocol : `${parts.protocol}:`
  const auth = parts.username
    ? `${encodeURIComponent(parts.username)}${parts.password ? `:${encodeURIComponent(parts.password)}` : ''}@`
    : ''
  const port = parts.port ? `:${parts.port}` : ''
  const pathname = parts.pathname.startsWith('/') || parts.pathname === '' ? parts.pathname || '/' : `/${parts.pathname}`
  const query = encodeParams(parts.params)
  const hash = parts.hash === '' ? '' : parts.hash.startsWith('#') ? parts.hash : `#${parts.hash}`
  const href = `${protocol}//${auth}${parts.hostname}${port}${pathname}${query ? `?${query}` : ''}${hash}`
  try {
    return ok(new URL(href).href)
  } catch {
    return err('Nie da się złożyć adresu z tych części.')
  }
}
