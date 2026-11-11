<script setup lang="ts">
import { ref } from 'vue'
import { validateEuVat } from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { validationMessage } from '../messages'
import { VAT_VALID_LABEL } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateEuVat(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid ? VAT_VALID_LABEL : validationMessage(result.error)
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
    <CheckResult
      :message="verdict"
      :error="verdictError"
    />
  </div>
</template>
