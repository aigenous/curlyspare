<script setup lang="ts">
import { computed, ref } from 'vue'
import { HASH_ALGORITHMS, hashBytes, hashUtf8, type HashAlgorithm } from '../../../lib/converters/hash'
import CopyButton from '../../../components/CopyButton.vue'
import { readInputFile } from '../browser'

const algorithm = ref<HashAlgorithm>('SHA-256')
const source = ref('')
const hex = ref('')
const encoded = ref('')
const upper = ref(false)
const error = ref('')
const status = ref('')
const shownHex = computed(() => (upper.value ? hex.value.toUpperCase() : hex.value))

async function fromText(): Promise<void> {
  const digest = await hashUtf8(source.value, algorithm.value)
  hex.value = digest.hex
  encoded.value = digest.base64
  error.value = ''
  status.value = 'Policzono skrót tekstu.'
}

async function fromFile(event: { target: unknown }): Promise<void> {
  const bytes = await readInputFile(event.target)
  if (!bytes.ok) {
    error.value = bytes.error
    status.value = ''
    return
  }
  const digest = await hashBytes(bytes.value, algorithm.value)
  hex.value = digest.hex
  encoded.value = digest.base64
  error.value = ''
  status.value = `Policzono skrót pliku (${bytes.value.byteLength} B).`
}
</script>

<template>
  <div class="cv">
    <label class="cv-field">
      Algorytm
      <select
        v-model="algorithm"
        class="input cv-narrow"
      >
        <option
          v-for="item in HASH_ALGORITHMS"
          :key="item"
          :value="item"
        >
          {{ item }}
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
        @keydown.ctrl.enter.prevent="fromText"
        @keydown.meta.enter.prevent="fromText"
      />
    </label>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="fromText"
      >
        Policz tekst
      </button>
      <label class="button-ghost cv-file-label">
        Policz plik
        <input
          class="cv-file"
          type="file"
          @change="fromFile"
        >
      </label>
      <label class="cv-check">
        <input
          v-model="upper"
          type="checkbox"
        >
        Wielkie litery HEX
      </label>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-if="status"
      class="cv-message cv-ok"
      role="status"
    >
      {{ status }}
    </p>
    <label class="cv-field">
      Szesnastkowo
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        :value="shownHex"
      />
    </label>
    <div class="cv-actions">
      <CopyButton :text="shownHex" />
    </div>
    <label class="cv-field">
      Base64
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        :value="encoded"
      />
    </label>
    <div class="cv-actions">
      <CopyButton :text="encoded" />
    </div>
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>

<style scoped>
.cv-file-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.cv-file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
