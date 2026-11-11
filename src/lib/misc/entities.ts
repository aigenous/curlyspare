import { decode, encode } from 'he'

export const entityModes = ['encode', 'decode'] as const

export type EntityMode = (typeof entityModes)[number]

export function isEntityMode(value: string): value is EntityMode {
  return (entityModes as readonly string[]).includes(value)
}

export function convertEntities(value: string, mode: EntityMode): string {
  switch (mode) {
    case 'encode':
      return encode(value, { useNamedReferences: true })
    case 'decode':
      return decode(value)
    default: {
      const unexpected: never = mode
      return unexpected
    }
  }
}
