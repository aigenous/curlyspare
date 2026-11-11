<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { validateJsonSchema } from '../../../lib/converters/schema'

const data = ref('')
const schema = ref('')
const status = ref('')
const error = ref('')

function run(): void {
  const result = validateJsonSchema(data.value, schema.value)
  if (!result.ok) {
    status.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  status.value = result.value
}
</script>

<template>
  <div class="stack">
    <p class="hint">
      Sprawdzenie zostaje w przeglądarce. Schemat i dane nie są wysyłane.
    </p>
    <label>
      Dane JSON
      <textarea
        v-model="data"
        class="input mono"
        rows="8"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <label>
      JSON Schema
      <textarea
        v-model="schema"
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
      Sprawdź
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <p
      v-if="status"
      class="hint"
    >
      {{ status }}
    </p>
    <CopyButton :text="status || error" />
  </div>
</template>
