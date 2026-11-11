<script setup lang="ts">
import { ref } from 'vue'
import { validateIbanPl } from '../../../lib/generators'
import { validationMessage } from '../messages'
import { ibanPassMessage } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function check() {
  const result = validateIbanPl(probe.value)
  verdictError.value = !result.valid
  verdict.value = result.valid
    ? ibanPassMessage(result.formatted, result.nrb)
    : validationMessage(result.error)
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
    <p
      v-if="verdict"
      :class="verdictError ? 'message-error' : 'muted'"
      :role="verdictError ? 'alert' : 'status'"
    >
      {{ verdict }}
    </p>
  </div>
</template>
