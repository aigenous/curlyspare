<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { jsonToToml, tomlToJson } from '../../../lib/converters/toml'

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
    <label>
      TOML albo JSON
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
        @click="show(tomlToJson(source))"
      >
        TOML na JSON
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(jsonToToml(source))"
      >
        JSON na TOML
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
