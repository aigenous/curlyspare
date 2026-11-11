import { describe, expect, it } from 'vitest'
import { parseUserAgent } from './useragent'

const chrome =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const edge = `${chrome} Edg/120.0.2210.91`
const firefox = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'

describe('user agent parser', () => {
  it('tells Chrome, Edge, and Firefox apart', () => {
    expect(parseUserAgent(chrome)).toMatchObject({
      browser: 'Chrome',
      browserVersion: '120.0',
      os: 'Windows',
      osVersion: '10/11',
      device: 'komputer',
    })
    expect(parseUserAgent(edge)).toMatchObject({ browser: 'Edge', browserVersion: '120.0', device: 'komputer' })
    expect(parseUserAgent(firefox)).toMatchObject({ browser: 'Firefox', browserVersion: '121.0', os: 'Linux' })
  })

  it('reads an iPhone as Safari on iOS', () => {
    expect(parseUserAgent(iphone)).toMatchObject({
      browser: 'Safari',
      browserVersion: '17.2',
      os: 'iOS',
      osVersion: '17.2',
      device: 'telefon',
    })
    expect(parseUserAgent('')).toMatchObject({ browser: 'nieznana', os: 'nieznana', device: 'komputer' })
  })
})
