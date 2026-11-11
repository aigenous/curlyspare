<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { jsonToXml, xmlToJson } from '../../../lib/converters/xml-json'

const source = ref('')
const output = ref('')
const error = ref('')

function show(result: { ok: true; value: string } | { ok: false; error: string }): void {
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
      Atrybuty dostają przedrostek @, tekst mieszany ląduje w #text, a powtórzone elementy stają się tablicą.
    </p>
    <label>
      XML albo JSON
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
        @click="show(xmlToJson(source))"
      >
        XML na JSON
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(jsonToXml(source))"
      >
        JSON na XML
      </button>
    </div>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
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
