<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { queryJsonPath } from '../../../lib/converters/jsonpath'

const data = ref('')
const path = ref('$.store.book[*].title')
const output = ref('')
const error = ref('')

function run(): void {
  const result = queryJsonPath(data.value, path.value)
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
    <p class="hint">
      Zapytanie zostaje w przeglądarce. Obsługiwane są ścieżki, filtry, wycinki i zejście rekurencyjne.
    </p>
    <label>
      JSON
      <textarea
        v-model="data"
        class="input mono"
        rows="8"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <label>
      JSONPath
      <input
        v-model="path"
        class="input mono"
        type="text"
        spellcheck="false"
        autocomplete="off"
        @keydown.enter.prevent="run"
      >
    </label>
    <button
      class="button"
      type="button"
      @click="run"
    >
      Szukaj
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Trafienia
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
