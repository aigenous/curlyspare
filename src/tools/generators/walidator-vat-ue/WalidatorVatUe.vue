<script setup lang="ts">
import { ref } from 'vue'
import { validateEuVat } from '../../../lib/generators'
import { validationMessage } from '../messages'
import { euVatPassMessage } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateEuVat(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? euVatPassMessage(result.country, result.vat)
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Sprawdza wyłącznie format i – tam, gdzie algorytm jest publiczny – sumę kontrolną numeru VAT państw UE.
      Nie sprawdza statusu w VIES (aktywności podatnika VAT UE) ani w żadnym innym rejestrze.
      Prefiks Grecji to EL.
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
