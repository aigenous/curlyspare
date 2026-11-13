<script setup lang="ts">
import { ref } from 'vue'
import {
  COMMON_TIME_ZONES,
  DEFAULT_TIME_ZONE,
  currentUnixView,
  unixToZoned,
  zonedToUnix,
  type UnixUnit,
  type UnixView,
} from '../../../lib/converters/timestamp'
import type { Result } from '../../../lib/converters/result'

const zone = ref(DEFAULT_TIME_ZONE)
const unixInput = ref('')
const unit = ref<UnixUnit>('auto')
const dateInput = ref('')
const view = ref<UnixView | null>(null)
const error = ref('')

function show(result: Result<UnixView>): void {
  if (!result.ok) {
    view.value = null
    error.value = result.error
    return
  }
  error.value = ''
  view.value = result.value
}

function fromUnix(): void {
  show(unixToZoned(unixInput.value, { unit: unit.value, timeZone: zone.value }))
}

function fromDate(): void {
  show(zonedToUnix(dateInput.value, { timeZone: zone.value }))
}

function useNow(): void {
  const result = currentUnixView(zone.value)
  if (!result.ok) {
    error.value = result.error
    view.value = null
    return
  }
  unixInput.value = String(Math.trunc(result.value.seconds))
  show(result)
}
</script>

<template>
  <div class="cv">
    <label class="cv-field">
      Strefa czasowa
      <input
        v-model="zone"
        class="input"
        type="text"
        list="strefy-czasu"
        spellcheck="false"
        autocomplete="off"
      >
    </label>
    <datalist id="strefy-czasu">
      <option
        v-for="item in COMMON_TIME_ZONES"
        :key="item"
        :value="item"
      >
        {{ item }}
      </option>
    </datalist>
    <div class="cv-split">
      <section class="cv">
        <h2>Znacznik na datę</h2>
        <label class="cv-field">
          Znacznik Unix
          <input
            v-model="unixInput"
            class="input"
            type="text"
            inputmode="decimal"
            spellcheck="false"
            autocomplete="off"
            @keydown.enter.prevent="fromUnix"
          >
        </label>
        <label class="cv-field">
          Jednostka
          <select
            v-model="unit"
            class="input cv-narrow"
          >
            <option value="auto">
              automatycznie
            </option>
            <option value="seconds">
              sekundy
            </option>
            <option value="milliseconds">
              milisekundy
            </option>
          </select>
        </label>
        <div class="cv-actions">
          <button
            class="button"
            type="button"
            @click="fromUnix"
          >
            Przelicz na datę
          </button>
          <button
            class="button-ghost"
            type="button"
            @click="useNow"
          >
            Bieżący czas
          </button>
        </div>
      </section>
      <section class="cv">
        <h2>Data na znacznik</h2>
        <label class="cv-field">
          Data lokalna
          <input
            v-model="dateInput"
            class="input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            placeholder="2024-01-15 12:00:00"
            @keydown.enter.prevent="fromDate"
          >
        </label>
        <p class="cv-note">
          Bez strefy w tekście data jest liczona w wybranej strefie. Można podać też znacznik z Z albo przesunięciem, na przykład 2024-01-15T11:00:00Z.
        </p>
        <div class="cv-actions">
          <button
            class="button"
            type="button"
            @click="fromDate"
          >
            Przelicz na Unix
          </button>
        </div>
      </section>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <dl
      v-if="view"
      class="cv-meta"
    >
      <div>
        <dt>UTC</dt>
        <dd>{{ view.isoUtc }}</dd>
      </div>
      <div>
        <dt>Czas lokalny</dt>
        <dd>{{ view.local }}</dd>
      </div>
      <div>
        <dt>Sekundy</dt>
        <dd>{{ view.seconds }}</dd>
      </div>
      <div>
        <dt>Milisekundy</dt>
        <dd>{{ view.milliseconds }}</dd>
      </div>
    </dl>
    <p
      v-if="view?.ambiguous"
      class="cv-note"
    >
      Ta godzina wypada dwa razy. Wybrano wcześniejszą chwilę.
    </p>
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>
