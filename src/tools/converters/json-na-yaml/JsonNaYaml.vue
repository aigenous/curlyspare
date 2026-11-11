<script setup lang="ts">
import { ref } from 'vue'
import { jsonToYaml, yamlToJson } from '../../../lib/converters/yaml'
import CopyButton from '../CopyButton.vue'

const source = ref('')
const output = ref('')
const error = ref('')

function apply(result: { ok: true; value: string } | { ok: false; error: string }): void {
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
  <div class="cv">
    <p class="cv-note">
      Obsługiwany jest blokowy YAML: wcięcia spacjami, mapy, listy i skalary. Wcięcie wyniku to 2 spacje.
    </p>
    <label class="cv-field">
      JSON albo YAML
      <textarea
        v-model="source"
        class="input cv-area"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      />
    </label>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="apply(jsonToYaml(source))"
      >
        JSON na YAML
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="apply(yamlToJson(source))"
      >
        YAML na JSON
      </button>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <label class="cv-field">
      Wynik
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <div class="cv-actions">
      <CopyButton :text="output" />
    </div>
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>
