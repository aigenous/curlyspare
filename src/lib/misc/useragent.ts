export type DeviceKind = 'telefon' | 'tablet' | 'komputer'

export interface UserAgentInfo {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  device: DeviceKind
}

const unknown = 'nieznana'

export function parseUserAgent(value: string): UserAgentInfo {
  const agent = value.trim()
  const device = detectDevice(agent)
  const os = detectOs(agent)
  const browser = detectBrowser(agent)
  return { ...browser, ...os, device }
}

function detectDevice(agent: string): DeviceKind {
  if (/ipad|tablet|playbook|silk/i.test(agent)) return 'tablet'
  if (/mobile|iphone|ipod|android/i.test(agent)) return 'telefon'
  return 'komputer'
}

function detectOs(agent: string): Pick<UserAgentInfo, 'os' | 'osVersion'> {
  const windows = /Windows NT ([0-9.]+)/.exec(agent)
  if (windows) {
    const version = windows[1] === '10.0' ? '10/11' : (windows[1] ?? '')
    return { os: 'Windows', osVersion: version }
  }
  const android = /Android ([0-9.]+)/.exec(agent)
  if (android) return { os: 'Android', osVersion: android[1] ?? '' }
  const ios = /(?:iPhone|iPad|CPU) OS ([0-9_]+)/.exec(agent)
  if (ios) return { os: 'iOS', osVersion: (ios[1] ?? '').replaceAll('_', '.') }
  if (/CrOS/.test(agent)) return { os: 'ChromeOS', osVersion: /CrOS [^ ]+ ([0-9.]+)/.exec(agent)?.[1] ?? '' }
  const mac = /Mac OS X ([0-9_]+)/.exec(agent)
  if (mac) return { os: 'macOS', osVersion: (mac[1] ?? '').replaceAll('_', '.') }
  if (/Linux/.test(agent)) return { os: 'Linux', osVersion: '' }
  return { os: unknown, osVersion: '' }
}

function detectBrowser(agent: string): Pick<UserAgentInfo, 'browser' | 'browserVersion'> {
  const patterns: [string, RegExp][] = [
    ['Edge', /Edg(?:e|A|iOS)?\/([0-9.]+)/],
    ['Opera', /(?:OPR|Opera)\/([0-9.]+)/],
    ['Samsung Internet', /SamsungBrowser\/([0-9.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([0-9.]+)/],
    ['Chrome', /(?:Chrome|CriOS)\/([0-9.]+)/],
    ['Safari', /Version\/([0-9.]+).*Safari/],
  ]
  for (const [name, pattern] of patterns) {
    const match = pattern.exec(agent)
    if (match) return { browser: name, browserVersion: major(match[1] ?? '') }
  }
  return { browser: unknown, browserVersion: '' }
}

function major(version: string): string {
  return version.split('.').slice(0, 2).join('.')
}
