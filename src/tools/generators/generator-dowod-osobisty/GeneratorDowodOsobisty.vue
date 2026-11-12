<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import {
  formatDowodOsobisty,
  generateDowodyOsobiste,
  validateDowodOsobisty,
} from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'
import { GENERATED_NUMBER_LABEL, VALID_NUMBER_LABEL } from '../verdicts'

const count = ref(1)
const generated = ref('')
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictDetail = ref('')
const verdictError = ref(false)

function generate() {
  error.value = ''
  generated.value = ''
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  generated.value = generateDowodyOsobiste(parsedCount).map(formatDowodOsobisty).join('\n')
}

function check() {
  verdictDetail.value = ''
  const result = validateDowodOsobisty(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  verdict.value = VALID_NUMBER_LABEL
  verdictDetail.value = `Zapis: ${result.formatted}. Seria ${result.series}.`
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
      <p
        v-if="generated"
        class="muted"
      >
        {{ GENERATED_NUMBER_LABEL }}
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
        Seria i numer
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
      <CheckResult
        :message="verdict"
        :error="verdictError"
        :detail="verdictDetail"
      />
    </section>
  </div>
</template>
