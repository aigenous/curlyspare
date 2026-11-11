<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { CSV_DELIMITERS, type CsvDelimiter } from '../../../lib/converters/csv'
import { csvToMarkdown } from '../../../lib/converters/csv-markdown'

const delimiter = ref<CsvDelimiter>(',')
const source = ref('')
const output = ref('')
const error = ref('')

function onDelimiter(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === ',' || value === ';' || value === '\t') delimiter.value = value
}

function run(): void {
  const result = csvToMarkdown(source.value, delimiter.value)
  if (!result.ok) {
    output.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  output.value = result.value
}
</script>

<template>
  <div class="stack">
    <label>
      Separator
      <select
        class="input"
        :value="delimiter"
        @change="onDelimiter"
      >
        <option
          v-for="item in CSV_DELIMITERS"
          :key="item"
          :value="item"
        >
          {{ item === '\t' ? 'tabulator' : item }}
        </option>
      </select>
    </label>
    <label>
      CSV
      <textarea
        v-model="source"
        class="input mono"
        rows="8"
        spellcheck="false"
        autocomplete="off"
        @keydown.ctrl.enter.prevent="run"
        @keydown.meta.enter.prevent="run"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="run"
    >
      Zamień na tabelę
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Markdown
      <textarea
        class="input mono"
        rows="8"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
