<script setup lang="ts">
import { ref } from 'vue'
import { validateVin } from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { validationMessage } from '../messages'
import { vinPassLabel } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateVin(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? vinPassLabel(result.checkDigitVerified)
    : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Sprawdza format VIN (ISO 3779). Cyfrę kontrolną sprawdza tylko dla numerów z rynku północnoamerykańskiego.
      Litery I, O i Q są niedozwolone.
    </p>
    <label>
      VIN
      <input
        v-model="probe"
        class="input mono"
        type="text"
        autocomplete="off"
        spellcheck="false"
        maxlength="24"
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
