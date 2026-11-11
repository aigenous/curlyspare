declare module 'he' {
  export function encode(text: string, options?: { useNamedReferences?: boolean }): string
  export function decode(html: string): string
}
