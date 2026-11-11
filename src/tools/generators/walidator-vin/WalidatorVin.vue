<script setup lang="ts">
import { ref } from 'vue'
import { validateVin } from '../../../lib/generators'
import { validationMessage } from '../messages'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateVin(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid ? `Poprawny VIN: ${result.vin}.` : validationMessage(result.error)
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Sprawdza cyfrę kontrolną VIN (ISO 3779). Litery I, O i Q są niedozwolone.
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
    <p
      v-if="verdict"
      :class="verdictError ? 'message-error' : 'muted'"
      :role="verdictError ? 'alert' : 'status'"
    >
      {{ verdict }}
    </p>
  </div>
</template>
