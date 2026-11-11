<script setup lang="ts">
import { ref } from 'vue'
import { validateEuVat } from '../../../lib/generators'
import { validationMessage } from '../messages'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateEuVat(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? `Poprawny numer VAT (${result.country}): ${result.vat}.`
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Sprawdza format i, tam gdzie jest publiczny, sumę kontrolną numeru VAT państw UE.
      Prefiks Grecji to EL. Nie ma zapytania do żadnego rejestru.
    </p>
    <label>
      Numer VAT
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
  </div>
</template>
