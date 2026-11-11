<script setup lang="ts">
import { ref } from 'vue'
import { generateUuids, inspectUuid, type UuidVersion } from '../../../lib/converters/uuid'
import CopyButton from '../CopyButton.vue'

const version = ref<UuidVersion>(4)
const count = ref(5)
const uppercase = ref(false)
const output = ref('')
const error = ref('')
const probe = ref('')
const info = ref('')

function generate(): void {
  const result = generateUuids({
    version: version.value,
    count: count.value,
    uppercase: uppercase.value,
  })
  if (!result.ok) {
    output.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  output.value = result.value.join('\n')
}

function check(): void {
  const result = inspectUuid(probe.value)
  if (!result.valid) {
    info.value = result.error
    return
  }
  const stamp = result.timestampMs === null ? '' : ` Znacznik czasu v7: ${result.timestampMs}.`
  info.value = `Poprawny UUID, wersja ${result.versionLabel}, wariant ${result.variantLabel}.${stamp}`
}
</script>

<template>
  <div class="cv">
    <div class="cv-options">
      <label class="cv-check">
        <input
          v-model="version"
          type="radio"
          name="wersja-uuid"
          :value="4"
        >
        v4 — losowy
      </label>
      <label class="cv-check">
        <input
          v-model="version"
          type="radio"
          name="wersja-uuid"
          :value="7"
        >
        v7 — czas uniksowy
      </label>
      <label class="cv-field">
        Liczba
        <input
          v-model.number="count"
          class="input cv-narrow"
          type="number"
          min="1"
          max="1000"
          step="1"
        >
      </label>
      <label class="cv-check">
        <input
          v-model="uppercase"
          type="checkbox"
        >
        Wielkie litery
      </label>
    </div>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="generate"
      >
        Generuj
      </button>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <label class="cv-field">
      Identyfikatory
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <div class="cv-actions">
      <CopyButton :text="output" />
    </div>
    <h2>Sprawdzenie</h2>
    <label class="cv-field">
      UUID
      <input
        v-model="probe"
        class="input"
        type="text"
        spellcheck="false"
        autocomplete="off"
        @keydown.enter.prevent="check"
      >
    </label>
    <div class="cv-actions">
      <button
        class="button-ghost"
        type="button"
        @click="check"
      >
        Sprawdź
      </button>
    </div>
    <p
      v-if="info"
      class="cv-message cv-ok"
      role="status"
    >
      {{ info }}
    </p>
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>
