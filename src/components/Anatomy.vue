<script setup lang="ts">
import type { AnatomyCell, CellState, ChecksumAnatomy } from '../tools/anatomy/types'
import '../styles/anatomy.css'

defineProps<{
  anatomy: ChecksumAnatomy
  labels: Readonly<Record<string, string>>
}>()

function cellClass(state: CellState): string {
  switch (state) {
    case 'empty':
      return 'cell cell--empty'
    case 'filled':
      return 'cell'
    case 'bad':
      return 'cell cell--bad'
    case 'check-ok':
      return 'cell cell--mark'
    default: {
      const unexpected: never = state
      return unexpected
    }
  }
}

function cellText(cell: AnatomyCell): string {
  return cell.state === 'empty' ? '·' : cell.char
}
</script>

<template>
  <div
    class="anatomy"
    aria-hidden="true"
  >
    <div
      v-for="part in anatomy.parts"
      :key="part.labelKey"
      class="anatomy__part"
      :style="{ '--n': String(part.to - part.from) }"
    >
      <div class="cells">
        <span
          v-for="cell in anatomy.cells.slice(part.from, part.to)"
          :key="cell.index"
          :class="cellClass(cell.state)"
        >{{ cellText(cell) }}</span>
      </div>
      <span class="brace"><i /><i /><i /><i /></span>
      <span class="anatomy__label">{{ labels[part.labelKey] ?? part.labelKey }}</span>
    </div>
  </div>
</template>
