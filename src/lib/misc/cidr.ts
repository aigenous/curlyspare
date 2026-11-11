export interface Ipv4Network {
  address: string
  prefix: number
  network: string
  broadcast: string
  netmask: string
  wildcard: string
  firstHost: string
  lastHost: string
  usableHosts: string
  totalAddresses: string
}

export function calculateCidr(
  input: string,
): { ok: true; network: Ipv4Network } | { ok: false; error: string } {
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(input.trim())
  if (!match) return { ok: false, error: 'Podaj adres w postaci 192.168.1.10/24.' }
  const addressText = match[1] ?? ''
  const prefixText = match[2] ?? ''
  const address = parseIpv4(addressText)
  const prefix = Number(prefixText)
  if (address === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { ok: false, error: 'Adres albo długość prefiksu jest niepoprawna.' }
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcard = (~mask) >>> 0
  const network = (address & mask) >>> 0
  const broadcast = (network | wildcard) >>> 0
  const hostBits = 32 - prefix
  const total = 2 ** hostBits
  const pointToPoint = prefix >= 31
  const first = pointToPoint ? network : network + 1
  const last = pointToPoint ? broadcast : broadcast - 1
  const usable = pointToPoint ? total : total - 2
  return {
    ok: true,
    network: {
      address: formatIpv4(address),
      prefix,
      network: formatIpv4(network),
      broadcast: formatIpv4(broadcast),
      netmask: formatIpv4(mask),
      wildcard: formatIpv4(wildcard),
      firstHost: formatIpv4(first),
      lastHost: formatIpv4(last),
      usableHosts: String(usable),
      totalAddresses: String(total),
    },
  }
}

function parseIpv4(value: string): number | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    result = result * 256 + octet
  }
  return result
}

function formatIpv4(value: number): string {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.')
}
