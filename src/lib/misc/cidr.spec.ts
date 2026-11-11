import { describe, expect, it } from 'vitest'
import { calculateCidr } from './cidr'

describe('IPv4 CIDR', () => {
  it('calculates a /24 network', () => {
    expect(calculateCidr('192.168.1.10/24')).toEqual({
      ok: true,
      network: {
        address: '192.168.1.10',
        prefix: 24,
        network: '192.168.1.0',
        broadcast: '192.168.1.255',
        netmask: '255.255.255.0',
        wildcard: '0.0.0.255',
        firstHost: '192.168.1.1',
        lastHost: '192.168.1.254',
        usableHosts: '254',
        totalAddresses: '256',
      },
    })
  })

  it('treats /31 and /32 as usable addresses', () => {
    const slash31 = calculateCidr('10.0.0.0/31')
    expect(slash31.ok && slash31.network.firstHost).toBe('10.0.0.0')
    expect(slash31.ok && slash31.network.lastHost).toBe('10.0.0.1')
    expect(slash31.ok && slash31.network.usableHosts).toBe('2')
    const slash32 = calculateCidr('10.0.0.1/32')
    expect(slash32.ok && slash32.network.network).toBe('10.0.0.1')
    expect(slash32.ok && slash32.network.broadcast).toBe('10.0.0.1')
    expect(slash32.ok && slash32.network.usableHosts).toBe('1')
  })

  it('counts the whole address space for /0 and rejects garbage', () => {
    const all = calculateCidr('0.0.0.0/0')
    expect(all.ok && all.network.totalAddresses).toBe('4294967296')
    expect(all.ok && all.network.usableHosts).toBe('4294967294')
    expect(calculateCidr('192.168.1.256/24').ok).toBe(false)
    expect(calculateCidr('10.0.0.1/33').ok).toBe(false)
    expect(calculateCidr('nie-adres').ok).toBe(false)
  })
})
