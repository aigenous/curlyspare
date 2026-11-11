<script setup lang="ts">
import { ref } from 'vue'
import {
  describeJsonValue,
  formatJson,
  formatJsonIssue,
  minifyJson,
  validateJson,
  type JsonFormatOptions,
  type JsonIssue,
} from '../../../lib/converters/json'
import CopyButton from '../CopyButton.vue'
import { selectTextPosition } from '../browser'

const source = ref('')
const output = ref('')
const error = ref('')
const status = ref('')
const indent = ref<'2' | '4' | 'tab'>('2')
const sortKeys = ref(false)
const sourceEl = ref<unknown>(null)

function options(): JsonFormatOptions {
  return {
    indent: indent.value === 'tab' ? 'tab' : Number(indent.value),
    sortKeys: sortKeys.value,
  }
}

function showIssue(issue: JsonIssue): void {
  output.value = ''
  status.value = ''
  error.value = formatJsonIssue(issue)
  selectTextPosition(sourceEl.value, issue.position)
}

function runFormat(): void {
  const result = formatJson(source.value, options())
  if (!result.ok) {
    showIssue(result)
    return
  }
  error.value = ''
  status.value = ''
  output.value = result.value
}

function runMinify(): void {
  const result = minifyJson(source.value)
  if (!result.ok) {
    showIssue(result)
    return
  }
  error.value = ''
  status.value = ''
  output.value = result.value
}

function runValidate(): void {
  const result = validateJson(source.value)
  if (!result.ok) {
    showIssue(result)
    return
  }
  error.value = ''
  output.value = ''
  status.value = describeJsonValue(result.value)
}
</script>

<template>
  <div class="cv">
    <label class="cv-field">
      Dokument JSON
      <textarea
        ref="sourceEl"
        v-model="source"
        class="input cv-area"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        @keydown.ctrl.enter.prevent="runFormat"
        @keydown.meta.enter.prevent="runFormat"
      />
    </label>
    <div class="cv-options">
      <label class="cv-field">
        Wcięcie
        <select
          v-model="indent"
          class="input cv-narrow"
        >
          <option value="2">
            2 spacje
          </option>
          <option value="4">
            4 spacje
          </option>
          <option value="tab">
            tabulator
          </option>
        </select>
      </label>
      <label class="cv-check">
        <input
          v-model="sortKeys"
          type="checkbox"
        >
        Sortuj klucze
      </label>
    </div>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="runFormat"
      >
        Formatuj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="runMinify"
      >
        Minimalizuj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="runValidate"
      >
        Sprawdź
      </button>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-if="status"
      class="cv-message cv-ok"
      role="status"
    >
      {{ status }}
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
