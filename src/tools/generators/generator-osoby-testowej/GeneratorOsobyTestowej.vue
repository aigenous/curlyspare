<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import {
  formatTestPersonCopyLine,
  generateTestPeople,
  parseIsoDate,
  testPeopleToCsv,
  testPeopleToJson,
  type CalendarDate,
  type PeselSex,
  type TestPerson,
} from '../../../lib/generators'
import { downloadText } from '../download'
import { COUNT_RANGE_ERROR, peselSexLabel, readCount } from '../messages'

const birthDate = ref('')
const sex = ref<'losowa' | PeselSex>('losowa')
const count = ref(1)
const people = ref<TestPerson[]>([])
const error = ref('')

function generate() {
  error.value = ''
  people.value = []
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
    people.value = generateTestPeople(parsedCount, {
      birthDate: date,
      sex: sex.value === 'losowa' ? undefined : sex.value,
    })
  } catch {
    error.value = 'Nie udało się wygenerować osób dla tych danych.'
  }
}

function line(person: TestPerson): string {
  return formatTestPersonCopyLine(person, peselSexLabel(person.sex))
}

function downloadCsv() {
  downloadText('osoby-testowe.csv', `\uFEFF${testPeopleToCsv(people.value)}`, 'text/csv;charset=utf-8')
}

function downloadJson() {
  downloadText('osoby-testowe.json', testPeopleToJson(people.value), 'application/json;charset=utf-8')
}
</script>

<template>
  <div class="stack">
    <p class="muted">
      Imiona, nazwiska i adresy są wymyślone. Kod pocztowy ma tylko poprawny format,
      a PESEL tylko sumę kontrolną. To nie są dane żadnej osoby.
    </p>
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
          Ile osób
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
      <label v-if="people.length > 0">
        Wynik
        <textarea
          class="input mono"
          rows="8"
          readonly
          :value="people.map(line).join('\n')"
        />
      </label>
      <div
        v-if="people.length > 0"
        class="row"
      >
        <CopyButton :text="people.map(line).join('\n')" />
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
  </div>
</template>
