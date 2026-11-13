<script setup lang="ts">
import type { AnatomyCell, CellState, ChecksumAnatomy } from '../tools/anatomy/types'
import '../styles/anatomy.css'

const props = defineProps<{
  anatomy: ChecksumAnatomy
  labels: Readonly<Record<string, string>>
  summary: string
}>()

function cellClass(state: CellState): string {
  switch (state) {
    case 'empty':
      return 'anatomy__cell anatomy__cell--empty'
    case 'filled':
      return 'anatomy__cell'
    case 'bad':
      return 'anatomy__cell anatomy__cell--bad'
    case 'check-ok':
      return 'anatomy__cell anatomy__cell--mark'
    default: {
      const unexpected: never = state
      return unexpected
    }
  }
}

function cellText(cell: AnatomyCell): string {
  return cell.state === 'empty' ? '·' : cell.char
}

function labelFor(key: string): string {
  const label = props.labels[key]
  if (label === undefined) {
    if (import.meta.env.DEV) {
      window.console.warn(`Missing anatomy label: ${key}`)
    }
    return ''
  }
  return label
}

function partStyle(part: { from: number; to: number }): { flex: string; minWidth: string } {
  const count = part.to - part.from
  return {
    flex: `${count} 1 0`,
    minWidth: `min(100%, max(calc(${count} * 1.15rem), 4rem))`,
  }
}
</script>

<template>
  <div class="anatomy">
    <p class="anatomy__summary">
      {{ summary }}
    </p>
    <div
      class="anatomy__visual"
      aria-hidden="true"
    >
      <div
        v-for="part in anatomy.parts"
        :key="part.labelKey"
        class="anatomy__part"
        :style="partStyle(part)"
      >
        <div class="anatomy__cells">
          <span
            v-for="cell in anatomy.cells.slice(part.from, part.to)"
            :key="cell.index"
            :class="cellClass(cell.state)"
          >{{ cellText(cell) }}</span>
        </div>
        <span class="anatomy__brace"><i /><i /><i /><i /></span>
        <span class="anatomy__label">{{ labelFor(part.labelKey) }}</span>
      </div>
    </div>
  </div>
</template>
