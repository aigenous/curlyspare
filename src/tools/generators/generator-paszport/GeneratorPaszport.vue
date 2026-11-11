<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { formatPaszport, generatePaszporty, validatePaszport } from '../../../lib/generators'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'

const count = ref(1)
const generated = ref('')
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function generate() {
  error.value = ''
  generated.value = ''
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  generated.value = generatePaszporty(parsedCount).map(formatPaszport).join('\n')
}

function check() {
  const result = validatePaszport(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? `Poprawny numer paszportu: ${result.formatted}. Seria ${result.series}.`
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
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
      <CopyButton
        v-if="generated"
        :text="generated"
      />
    </section>
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        Numer paszportu
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
  </div>
</template>
