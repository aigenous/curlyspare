<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { convertCase, isCaseMode, type CaseMode } from '../../lib/misc/case'

const input = ref('Zażółć gęślą jaźń')
const mode = ref<CaseMode>('title')
const output = computed(() => convertCase(input.value, mode.value))

const options: { id: CaseMode; label: string }[] = [
  { id: 'upper', label: 'Wielkie litery' },
  { id: 'lower', label: 'Małe litery' },
  { id: 'sentence', label: 'Zdanie' },
  { id: 'title', label: 'Tytuł' },
  { id: 'camel', label: 'camelCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
]

function onMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isCaseMode(value)) mode.value = value
}
</script>

<template>
  <div class="stack">
    <label>
      Tekst
      <textarea
        v-model="input"
        class="input"
        rows="6"
      />
    </label>
    <label>
      Wielkość
      <select
        class="input"
        :value="mode"
        @change="onMode"
      >
        <option
          v-for="option in options"
          :key="option.id"
          :value="option.id"
        >
          {{ option.label }}
        </option>
      </select>
    </label>
    <label>
      Wynik
      <textarea
        class="input"
        rows="6"
        readonly
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
