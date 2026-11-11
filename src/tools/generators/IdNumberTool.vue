<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import type { ValidationErrorCode } from '../../lib/generators'
import { downloadText } from './download'
import {
  idDocumentExportFilename,
  idNumbersToCsv,
  idNumbersToJson,
  presentIdNumber,
  stripTestPrefix,
  type IdDocumentSlug,
} from './id-document-copy'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from './messages'

type IdResult =
  | { valid: true; formatted: string; series: string }
  | { valid: false; error: ValidationErrorCode }

const props = defineProps<{
  slug: IdDocumentSlug
  probeLabel: string
  passText: (formatted: string, series: string) => string
  generateMany: (count: number) => string[]
  format: (value: string) => string
  validate: (input: string) => IdResult
}>()

const count = ref(1)
const generated = ref('')
const rows = ref<string[]>([])
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function generate() {
  error.value = ''
  generated.value = ''
  rows.value = []
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  const lines = props.generateMany(parsedCount).map((value) => presentIdNumber(props.format(value)))
  rows.value = lines
  generated.value = lines.join('\n')
}

function check() {
  const result = props.validate(stripTestPrefix(probe.value))
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? props.passText(result.formatted, result.series)
    : validationMessage(result.error)
}

function downloadCsv() {
  downloadText(
    idDocumentExportFilename(props.slug, 'csv'),
    `\uFEFF${idNumbersToCsv(rows.value)}`,
    'text/csv;charset=utf-8',
  )
}

function downloadJson() {
  downloadText(
    idDocumentExportFilename(props.slug, 'json'),
    idNumbersToJson(rows.value),
    'application/json;charset=utf-8',
  )
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        {{ probeLabel }}
        <input
          v-model="probe"
          class="input mono"
          type="text"
          autocomplete="off"
          spellcheck="false"
        >
      </label>
      <button
        class="button"
        type="button"
        @click="check"
      >
        Sprawdź
      </button>
      <p
        v-if="verdict"
        :class="verdictError ? 'message-error' : 'muted'"
        :role="verdictError ? 'alert' : 'status'"
      >
        {{ verdict }}
      </p>
    </section>
    <section class="stack">
      <h2>Generowanie</h2>
      <label>
        Ile numerów
        <input
          v-model.number="count"
          class="input"
          type="number"
          min="1"
          max="100"
        >
      </label>
      <button
        class="button"
        type="button"
        @click="generate"
      >
        Generuj
      </button>
      <p
        v-if="error"
        class="message-error"
        role="alert"
      >
        {{ error }}
      </p>
      <label v-if="generated">
        Wynik
        <textarea
          class="input mono"
          rows="6"
          readonly
          :value="generated"
        />
      </label>
      <div
        v-if="generated"
        class="row"
      >
        <CopyButton :text="generated" />
        <button
          class="button button-ghost"
          type="button"
          @click="downloadCsv"
        >
          Pobierz CSV
        </button>
        <button
          class="button button-ghost"
          type="button"
          @click="downloadJson"
        >
          Pobierz JSON
        </button>
      </div>
    </section>
  </div>
</template>
