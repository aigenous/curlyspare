export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value }
}

export function err(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`)
}
