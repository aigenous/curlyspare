<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import {
  formatPolishDate,
  generatePesels,
  parseIsoDate,
  validatePesel,
  type CalendarDate,
  type PeselSex,
} from '../../../lib/generators'
import { identifiersToCsv, identifiersToJson, downloadText } from '../download'
import { COUNT_RANGE_ERROR, peselSexLabel, readCount, validationMessage } from '../messages'

const birthDate = ref('')
const sex = ref<'losowa' | PeselSex>('losowa')
const count = ref(1)
const generated = ref('')
const rows = ref<string[]>([])
const note = ref('')
const error = ref('')
const probe = ref('')
const verdict = ref('')
const verdictError = ref(false)

function generate() {
  error.value = ''
  note.value = ''
  generated.value = ''
  rows.value = []
  const parsedCount = readCount(count.value)
  if (parsedCount === null) {
    error.value = COUNT_RANGE_ERROR
    return
  }

  let date: CalendarDate | undefined
  if (birthDate.value) {
    const parsed = parseIsoDate(birthDate.value)
    if (parsed === null || parsed.year < 1800 || parsed.year > 2299) {
      error.value = 'Data musi być prawdziwym dniem z lat 1800–2299.'
      return
    }
    date = parsed
  }

  try {
    const values = generatePesels(parsedCount, {
      birthDate: date,
      sex: sex.value === 'losowa' ? undefined : sex.value,
    })
    rows.value = values
    generated.value = values.join('\n')
    const only = values[0]
    if (values.length === 1 && only !== undefined) {
      const result = validatePesel(only)
      if (result.valid) {
        note.value = `${formatPolishDate(result.birthDate)}, ${peselSexLabel(result.sex)}`
      }
    }
  } catch {
    error.value = 'Nie udało się wygenerować numerów dla tych danych.'
  }
}

function downloadCsv() {
  downloadText('pesel.csv', `\uFEFF${identifiersToCsv('pesel', rows.value)}`, 'text/csv;charset=utf-8')
}

function downloadJson() {
  downloadText('pesel.json', identifiersToJson(rows.value), 'application/json;charset=utf-8')
}

function check() {
  const result = validatePesel(probe.value)
  verdictError.value = !result.valid
  if (!result.valid) {
    verdict.value = validationMessage(result.error)
    return
  }
  verdict.value = `Poprawny PESEL. Data urodzenia: ${formatPolishDate(result.birthDate)}. Płeć: ${peselSexLabel(result.sex)}.`
}
</script>

<template>
  <div class="stack">
    <section class="stack">
      <h2>Generowanie</h2>
      <div class="row">
        <label>
          Data urodzenia
          <input
            v-model="birthDate"
            class="input"
            type="date"
            min="1800-01-01"
            max="2299-12-31"
          >
        </label>
        <label>
          Płeć
          <select
            v-model="sex"
            class="input"
          >
            <option value="losowa">
              Losowa
            </option>
            <option value="kobieta">
              Kobieta
            </option>
            <option value="mezczyzna">
              Mężczyzna
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
      <p class="muted">
        Puste pole daty losuje dzień z lat 1950–2005.
      </p>
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
      <div
        v-if="generated"
        class="row"
      >
        <CopyButton :text="generated" />
        <button
          class="button button-ghost"
          type="button"
          @click="downloadCsv"
        >
          Pobierz CSV
        </button>
        <button
          class="button button-ghost"
          type="button"
          @click="downloadJson"
        >
          Pobierz JSON
        </button>
      </div>
    </section>
    <section class="stack">
      <h2>Sprawdzanie</h2>
      <label>
        Numer PESEL
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
