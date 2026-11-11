<script setup lang="ts">
import { computed, ref } from 'vue'
import { diffModes, diffText, isDiffMode, type DiffMode } from '../../lib/misc/diff'

const before = ref('ala\nma\nkota')
const after = ref('ala\nnie ma\nkota')
const mode = ref<DiffMode>('line')
const chunks = computed(() => diffText(before.value, after.value, mode.value))

const modeLabel: Record<DiffMode, string> = {
  line: 'Linie',
  word: 'Słowa',
}

function onMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isDiffMode(value)) mode.value = value
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Było
        <textarea
          v-model="before"
          class="input"
          rows="8"
          spellcheck="false"
        />
      </label>
      <label>
        Jest
        <textarea
          v-model="after"
          class="input"
          rows="8"
          spellcheck="false"
        />
      </label>
    </div>
    <label>
      Tryb
      <select
        class="input"
        :value="mode"
        @change="onMode"
      >
        <option
          v-for="item in diffModes"
          :key="item"
          :value="item"
        >
          {{ modeLabel[item] }}
        </option>
      </select>
    </label>
    <div
      class="preview"
      aria-live="polite"
    >
      <span
        v-for="(chunk, index) in chunks"
        :key="index"
        :class="chunk.kind === 'equal' ? undefined : `diff-${chunk.kind}`"
      >{{ chunk.value }}</span>
    </div>
  </div>
</template>
