<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { formatIban, formatNrb, generateNrbs, validateNrb } from '../../../lib/generators'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'

const count = ref(1)
const bank = ref('')
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
  try {
    const values = generateNrbs(parsedCount, { bank: bank.value.trim() === '' ? undefined : bank.value })
    generated.value = values.map(formatNrb).join('\n')
  } catch {
    error.value = 'Numer rozliczeniowy musi mieć 8 cyfr i poprawną cyfrę kontrolną. Puste pole losuje fikcyjny numer.'
  }
}

function check() {
  const result = validateNrb(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? `Poprawny NRB: ${result.formatted}. IBAN: ${formatIban(result.iban)}. Numer rozliczeniowy: ${result.bank}.`
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Generowanie</h2>
      <p class="muted">
        Numer rozliczeniowy jest fikcyjny i ma tylko cyfrę kontrolną. Nie pochodzi z ewidencji banków.
      </p>
      <div class="row">
        <label>
          Numer rozliczeniowy
          <input
            v-model="bank"
            class="input mono"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            spellcheck="false"
            placeholder="8 cyfr, opcjonalnie"
          >
        </label>
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
      <CopyButton
        v-if="generated"
        :text="generated"
      />
    </section>
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        NRB lub IBAN PL
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
