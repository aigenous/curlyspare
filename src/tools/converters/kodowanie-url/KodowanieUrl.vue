<script setup lang="ts">
import { ref } from 'vue'
import { decodeUrl, encodeUrl, type UrlEncoding } from '../../../lib/converters/url'
import CopyButton from '../../../components/CopyButton.vue'

const source = ref('')
const output = ref('')
const error = ref('')
const mode = ref<UrlEncoding>('component')

function apply(result: { ok: true; value: string } | { ok: false; error: string }): void {
  if (!result.ok) {
    output.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  output.value = result.value
}
</script>

<template>
  <div class="cv">
    <label class="cv-field">
      Tryb
      <select
        v-model="mode"
        class="input cv-narrow"
      >
        <option value="component">
          składnik adresu
        </option>
        <option value="uri">
          cały adres
        </option>
        <option value="form">
          pole formularza (+ jako spacja)
        </option>
      </select>
    </label>
    <label class="cv-field">
      Tekst
      <textarea
        v-model="source"
        class="input cv-area"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      />
    </label>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="apply(encodeUrl(source, mode))"
      >
        Koduj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="apply(decodeUrl(source, mode))"
      >
        Dekoduj
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
      Wynik
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
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>
