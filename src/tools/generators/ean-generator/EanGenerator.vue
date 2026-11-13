<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { generateGtins, validateGtin, type GtinGenerateLength } from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'
import { GENERATED_NUMBER_LABEL, VALID_NUMBER_LABEL } from '../verdicts'

const length = ref<GtinGenerateLength>(13)
const count = ref(1)
const generated = ref('')
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictDetail = ref('')
const verdictError = ref(false)

function selectedLength(): GtinGenerateLength {
  if (length.value === 8 || length.value === 14) {
    return length.value
  }
  return 13
}

function generate() {
  error.value = ''
  generated.value = ''
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  generated.value = generateGtins(parsedCount, selectedLength()).join('\n')
}

function check() {
  verdictDetail.value = ''
  const result = validateGtin(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  verdict.value = VALID_NUMBER_LABEL
  verdictDetail.value = `${result.kind}: ${result.gtin}.`
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Generowanie</h2>
      <div class="row">
        <label>
          Rodzaj
          <select
            v-model.number="length"
            class="input"
          >
            <option :value="8">
              EAN-8
            </option>
            <option :value="13">
              EAN-13
            </option>
            <option :value="14">
              GTIN-14
            </option>
          </select>
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
      <p class="muted">
        Sprawdzane są EAN-8, UPC-A (12 cyfr), EAN-13 i GTIN-14.
      </p>
      <label>
        Numer
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
      <CheckResult
        :message="verdict"
        :error="verdictError"
        :detail="verdictDetail"
      />
    </section>
  </div>
</template>
