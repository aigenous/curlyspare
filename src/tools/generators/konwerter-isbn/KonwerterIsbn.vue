<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { validateIsbn } from '../../../lib/generators'
import CheckResult from '../CheckResult.vue'
import { validationMessage } from '../messages'
import { VALID_NUMBER_LABEL } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictDetail = ref('')
const verdictError = ref(false)
const isbn10 = ref('')
const isbn13 = ref('')

function check() {
  isbn10.value = ''
  isbn13.value = ''
  verdictDetail.value = ''
  const result = validateIsbn(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  isbn10.value = result.isbn10 ?? ''
  isbn13.value = result.isbn13
  verdict.value = VALID_NUMBER_LABEL
  verdictDetail.value = result.isbn10 === null ? 'Prefiks 979 nie ma odpowiednika ISBN-10.' : ''
}
</script>

<template>
  <div class="stack">
    <label>
      ISBN
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
    <label v-if="isbn10">
      ISBN-10
      <input
        class="input mono"
        type="text"
        readonly
        :value="isbn10"
      >
    </label>
    <CopyButton
      v-if="isbn10"
      :text="isbn10"
    />
    <label v-if="isbn13">
      ISBN-13
      <input
        class="input mono"
        type="text"
        readonly
        :value="isbn13"
      >
    </label>
    <CopyButton
      v-if="isbn13"
      :text="isbn13"
    />
  </div>
</template>
