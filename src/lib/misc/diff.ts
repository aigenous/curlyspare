import { diffLines, diffWordsWithSpace, type ChangeObject } from 'diff'

export const diffModes = ['line', 'word'] as const

export type DiffMode = (typeof diffModes)[number]
export type DiffKind = 'equal' | 'added' | 'removed'

export interface DiffChunk {
  kind: DiffKind
  value: string
}

export function isDiffMode(value: string): value is DiffMode {
  return (diffModes as readonly string[]).includes(value)
}

export function diffText(before: string, after: string, mode: DiffMode): DiffChunk[] {
  return changesFor(before, after, mode).map((change) => ({
    kind: chunkKind(change),
    value: change.value,
  }))
}

function changesFor(before: string, after: string, mode: DiffMode): ChangeObject<string>[] {
  switch (mode) {
    case 'line':
      return diffLines(before, after)
    case 'word':
      return diffWordsWithSpace(before, after)
    default: {
      const unexpected: never = mode
      return unexpected
    }
  }
}

function chunkKind(change: ChangeObject<string>): DiffKind {
  if (change.added) return 'added'
  if (change.removed) return 'removed'
  return 'equal'
}
