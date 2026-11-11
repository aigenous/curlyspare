import { describe, expect, it } from 'vitest'
import { hashBytes, hashUtf8 } from './hash'

describe('hash', () => {
  it('matches the known SHA vectors', async () => {
    expect((await hashUtf8('', 'SHA-256')).hex).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect((await hashUtf8('abc', 'SHA-256')).hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect((await hashUtf8('abc', 'SHA-1')).hex).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    expect((await hashUtf8('abc', 'SHA-512')).hex).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    )
  })

  it('hashes UTF-8 bytes and also returns Base64', async () => {
    const fromText = await hashUtf8('ą', 'SHA-256')
    const fromBytes = await hashBytes(Uint8Array.from([0xc4, 0x85]), 'SHA-256')
    expect(fromText).toEqual(fromBytes)
    expect(fromText.hex).toHaveLength(64)
    expect(fromText.base64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
  })
})
