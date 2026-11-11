<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { jsonToTypeScript } from '../../../lib/converters/typescript'

const source = ref('')
const rootName = ref('Root')
const output = ref('')
const error = ref('')

function run(): void {
  const result = jsonToTypeScript(source.value, rootName.value.trim() || 'Root')
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
      Nazwa głównego typu
      <input
        v-model="rootName"
        class="input mono"
        type="text"
        spellcheck="false"
        autocomplete="off"
      >
    </label>
    <label>
      Przykładowy JSON
      <textarea
        v-model="source"
        class="input mono"
        rows="10"
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
      Zbuduj interfejsy
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      TypeScript
      <textarea
        class="input mono"
        rows="12"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
