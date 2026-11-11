<script setup lang="ts">
import { ref } from 'vue'
import {
  decodeBase64,
  decodeBase64ToBytes,
  encodeBase64,
  encodeBase64Bytes,
  type Base64Variant,
} from '../../../lib/converters/base64'
import CopyButton from '../../../components/CopyButton.vue'
import { downloadBytes, readInputFile } from '../browser'

const source = ref('')
const output = ref('')
const error = ref('')
const status = ref('')
const variant = ref<Base64Variant>('auto')
const wrap = ref(false)
const binary = ref<Uint8Array | null>(null)

function clear(message: string): void {
  output.value = ''
  status.value = ''
  binary.value = null
  error.value = message
}

function encodeText(): void {
  output.value = encodeBase64(source.value, { variant: variant.value, wrap: wrap.value })
  error.value = ''
  binary.value = null
  status.value = 'Zakodowano tekst.'
}

function decodeText(): void {
  const text = decodeBase64(source.value, { variant: variant.value })
  binary.value = null
  if (text.ok) {
    output.value = text.value
    error.value = ''
    status.value = 'Odkodowano tekst.'
    return
  }
  output.value = ''
  status.value = ''
  error.value = text.error
  const bytes = decodeBase64ToBytes(source.value, { variant: variant.value })
  if (bytes.ok && text.error.includes('UTF-8')) binary.value = bytes.value
}

async function encodeFile(event: { target: unknown }): Promise<void> {
  const bytes = await readInputFile(event.target)
  if (!bytes.ok) {
    clear(bytes.error)
    return
  }
  output.value = encodeBase64Bytes(bytes.value, { variant: variant.value, wrap: wrap.value })
  error.value = ''
  binary.value = null
  status.value = `Zakodowano plik (${bytes.value.byteLength} B).`
}

function saveBytes(): void {
  if (!binary.value) return
  downloadBytes(binary.value, 'odkodowane.bin')
}
</script>

<template>
  <div class="cv">
    <label class="cv-field">
      Tekst albo Base64
      <textarea
        v-model="source"
        class="input cv-area"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
      />
    </label>
    <div class="cv-options">
      <label class="cv-field">
        Wariant
        <select
          v-model="variant"
          class="input cv-narrow"
        >
          <option value="auto">
            wykryj
          </option>
          <option value="standard">
            standardowy
          </option>
          <option value="url">
            URL-safe
          </option>
        </select>
      </label>
      <label class="cv-check">
        <input
          v-model="wrap"
          type="checkbox"
        >
        Zawijaj linie po 76 znakach
      </label>
    </div>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="encodeText"
      >
        Koduj tekst
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="decodeText"
      >
        Dekoduj tekst
      </button>
      <label class="button-ghost">
        Koduj plik
        <input
          class="cv-file"
          type="file"
          @change="encodeFile"
        >
      </label>
      <button
        v-if="binary"
        class="button-ghost"
        type="button"
        @click="saveBytes"
      >
        Pobierz bajty
      </button>
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

<style scoped>
.cv-file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.button-ghost {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

.button-ghost:has(.cv-file) {
  align-items: center;
}
</style>
