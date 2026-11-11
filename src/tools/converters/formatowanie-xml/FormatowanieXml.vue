<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { formatXml, minifyXml, validateXml } from '../../../lib/converters/xml'

const source = ref('')
const output = ref('')
const error = ref('')
const status = ref('')

function show(result: { ok: true; value: string } | { ok: false; error: string }, asStatus = false): void {
  if (!result.ok) {
    output.value = ''
    status.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  if (asStatus) {
    output.value = ''
    status.value = result.value
    return
  }
  status.value = ''
  output.value = result.value
}
</script>

<template>
  <div class="stack">
    <label>
      Dokument XML
      <textarea
        v-model="source"
        class="input mono"
        rows="10"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <div class="row">
      <button
        class="button"
        type="button"
        @click="show(formatXml(source))"
      >
        Formatuj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(minifyXml(source))"
      >
        Minimalizuj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(validateXml(source), true)"
      >
        Sprawdź
      </button>
    </div>
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
    <label>
      Wynik
      <textarea
        class="input mono"
        rows="10"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
