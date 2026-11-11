import { err, ok, type Result } from '../../lib/converters/result'

export const MAX_FILE_BYTES = 20 * 1024 * 1024

export async function readInputFile(target: unknown): Promise<Result<Uint8Array>> {
  if (!(target instanceof HTMLInputElement)) return err('Wybierz plik.')
  const file = target.files?.[0]
  if (!file) return err('Wybierz plik.')
  if (file.size > MAX_FILE_BYTES) return err('Plik jest większy niż 20 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  target.value = ''
  return ok(bytes)
}

export async function copyText(text: string): Promise<boolean> {
  if (text === '') return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return copyWithSelection(text)
  }
}

function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  let copied: boolean
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  document.body.removeChild(area)
  return copied
}

export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  const blob = new Blob([buffer])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function selectTextPosition(node: unknown, position: number): void {
  if (!node || typeof node !== 'object') return
  const element = node as {
    focus?: () => void
    setSelectionRange?: (start: number, end: number) => void
    value?: string
  }
  if (typeof element.focus !== 'function' || typeof element.setSelectionRange !== 'function') return
  const length = typeof element.value === 'string' ? element.value.length : position
  const start = Math.max(0, Math.min(position, length))
  element.focus()
  element.setSelectionRange(start, Math.min(start + 1, length))
}
