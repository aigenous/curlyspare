<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { validateIsbn } from '../../../lib/generators'
import { validationMessage } from '../messages'
import { isbnPassMessage } from '../verdicts'

const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)
const isbn10 = ref('')
const isbn13 = ref('')

function check() {
  isbn10.value = ''
  isbn13.value = ''
  const result = validateIsbn(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  isbn10.value = result.isbn10 ?? ''
  isbn13.value = result.isbn13
  verdict.value = isbnPassMessage(result.kind, result.isbn10)
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
    <p
      v-if="verdict"
      :class="verdictError ? 'message-error' : 'muted'"
      :role="verdictError ? 'alert' : 'status'"
    >
      {{ verdict }}
    </p>
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
