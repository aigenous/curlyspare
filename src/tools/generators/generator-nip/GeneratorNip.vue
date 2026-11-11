<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { formatNip, generateNips, validateNip } from '../../../lib/generators'
import { identifiersToCsv, identifiersToJson, downloadText } from '../download'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'

const count = ref(1)
const grouped = ref(false)
const generated = ref('')
const rows = ref<string[]>([])
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function present(nip: string): string {
  return grouped.value ? formatNip(nip) : nip
}

function generate() {
  error.value = ''
  generated.value = ''
  rows.value = []
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  rows.value = generateNips(parsedCount).map(present)
  generated.value = rows.value.join('\n')
}

function downloadCsv() {
  downloadText('nip.csv', `\uFEFF${identifiersToCsv('nip', rows.value)}`, 'text/csv;charset=utf-8')
}

function downloadJson() {
  downloadText('nip.json', identifiersToJson(rows.value), 'application/json;charset=utf-8')
}

function check() {
  const result = validateNip(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? `Poprawny NIP: ${result.formatted}.`
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Generowanie</h2>
      <div class="row">
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
        <label>
          <input
            v-model="grouped"
            type="checkbox"
          >
          Z myślnikami
        </label>
      </div>
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
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        Numer NIP
        <input
          v-model="probe"
          class="input mono"
          type="text"
          inputmode="numeric"
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
  </div>
</template>
