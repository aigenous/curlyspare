<script setup lang="ts">
import { ref } from 'vue'
import { csvToJson, jsonToCsv, type CsvDelimiter } from '../../../lib/converters/csv'
import CopyButton from '../../../components/CopyButton.vue'

const source = ref('')
const output = ref('')
const error = ref('')
const delimiter = ref<CsvDelimiter>(',')
const header = ref(true)

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
      Tablica obiektów dostaje wiersz nagłówka. Przy odczycie CSV komórki wracają jako tekst.
    </p>
    <div class="cv-options">
      <label class="cv-field">
        Separator
        <select
          v-model="delimiter"
          class="input cv-narrow"
        >
          <option value=",">
            przecinek
          </option>
          <option value=";">
            średnik
          </option>
          <option :value="'\t'">
            tabulator
          </option>
        </select>
      </label>
      <label class="cv-check">
        <input
          v-model="header"
          type="checkbox"
        >
        Pierwszy wiersz CSV to nagłówek
      </label>
    </div>
    <label class="cv-field">
      JSON albo CSV
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
        @click="apply(jsonToCsv(source, { delimiter }))"
      >
        JSON na CSV
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="apply(csvToJson(source, { delimiter, header }))"
      >
        CSV na JSON
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
