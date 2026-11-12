<script setup lang="ts">
import { ref } from 'vue'
import { validateIbanPl } from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { validationMessage } from '../messages'
import { VALID_NUMBER_LABEL } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictDetail = ref('')
const verdictError = ref(false)

function check() {
  verdictDetail.value = ''
  const result = validateIbanPl(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  verdict.value = VALID_NUMBER_LABEL
  verdictDetail.value = `Zapis: ${result.formatted}. NRB: ${result.nrb}.`
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Sprawdzenie liczy tylko sumę kontrolną ISO 13616 (mod 97) i zostaje w tej przeglądarce. Nie potwierdza, że rachunek istnieje.
    </p>
    <label>
      IBAN
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
  </div>
</template>
