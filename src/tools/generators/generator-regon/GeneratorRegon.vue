<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { generateRegons, validateRegon, type RegonLength } from '../../../lib/generators'
import { COUNT_RANGE_ERROR, readCount, validationMessage } from '../messages'

const length = ref<RegonLength>(9)
const count = ref(1)
const generated = ref('')
const note = ref('')
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function selectedLength(): RegonLength {
  return length.value === 14 ? 14 : 9
}

function generate() {
  error.value = ''
  note.value = ''
  generated.value = ''
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }
  const values = generateRegons(parsedCount, selectedLength())
  generated.value = values.join('\n')
  const only = values[0]
  if (values.length === 1 && only !== undefined && selectedLength() === 14) {
    const result = validateRegon(only)
    if (result.valid) {
      note.value = `REGON podmiotu: ${result.entityRegon}.`
    }
  }
}

function check() {
  const result = validateRegon(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  verdict.value =
    result.length === 14
      ? `Poprawny REGON (14 cyfr). REGON podmiotu: ${result.entityRegon}.`
      : 'Poprawny REGON (9 cyfr).'
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Generowanie</h2>
      <div class="row">
        <label>
          Długość
          <select
            v-model.number="length"
            class="input"
          >
            <option :value="9">
              9 cyfr (podmiot)
            </option>
            <option :value="14">
              14 cyfr (jednostka lokalna)
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
      <label v-if="generated">
        Wynik
        <textarea
          class="input mono"
          rows="6"
          readonly
          :value="generated"
        />
      </label>
      <p
        v-if="note"
        class="muted"
      >
        {{ note }}
      </p>
      <CopyButton
        v-if="generated"
        :text="generated"
      />
    </section>
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        Numer REGON
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
      <p
        v-if="verdict"
        :class="verdictError ? 'message-error' : 'muted'"
        :role="verdictError ? 'alert' : 'status'"
      >
        {{ verdict }}
      </p>
    </section>
  </div>
</template>
