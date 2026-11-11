import { decodeBase64ToBytes, encodeBase64Bytes } from './base64'
import { assertNever, err, ok, type Result } from './result'

export const COMPRESSION_FORMATS = ['gzip', 'deflate'] as const
export type CompressionFormat = (typeof COMPRESSION_FORMATS)[number]

export function isCompressionFormat(value: string): value is CompressionFormat {
  return value === 'gzip' || value === 'deflate'
}

function copyBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(bytes.byteLength)
  const copy = new Uint8Array(buffer)
  copy.set(bytes)
  return copy
}

async function through(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const compressed = await new Response(new Blob([copyBytes(bytes)]).stream().pipeThrough(stream)).arrayBuffer()
  return new Uint8Array(compressed)
}

export async function compressToBase64(text: string, format: CompressionFormat): Promise<Result<string>> {
  switch (format) {
    case 'gzip':
    case 'deflate':
      break
    default:
      return assertNever(format)
  }
  if (typeof CompressionStream === 'undefined') return err('Ta przeglądarka nie obsługuje kompresji.')
  try {
    const bytes = await through(new TextEncoder().encode(text), new CompressionStream(format))
    return ok(encodeBase64Bytes(bytes))
  } catch {
    return err('Nie udało się skompresować tekstu.')
  }
}

export async function decompressFromBase64(input: string, format: CompressionFormat): Promise<Result<string>> {
  switch (format) {
    case 'gzip':
    case 'deflate':
      break
    default:
      return assertNever(format)
  }
  if (typeof DecompressionStream === 'undefined') return err('Ta przeglądarka nie obsługuje dekompresji.')
  const bytes = decodeBase64ToBytes(input)
  if (!bytes.ok) return bytes
  try {
    const inflated = await through(bytes.value, new DecompressionStream(format))
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(inflated))
  } catch {
    return err('Nie udało się rozpakować danych. Sprawdź format i Base64.')
  }
}
