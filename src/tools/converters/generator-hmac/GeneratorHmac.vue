<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { hmacText, isHmacAlgorithm, type HmacAlgorithm } from '../../../lib/converters/hmac'

const algorithm = ref<HmacAlgorithm>('SHA-256')
const key = ref('')
const message = ref('')
const hex = ref('')
const encoded = ref('')
const error = ref('')

function onAlgorithm(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isHmacAlgorithm(value)) algorithm.value = value
}

async function run(): Promise<void> {
  const result = await hmacText(key.value, message.value, algorithm.value)
  if (!result.ok) {
    hex.value = ''
    encoded.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  hex.value = result.value.hex
  encoded.value = result.value.base64
}
</script>

<template>
  <div class="stack">
    <p class="hint">
      HMAC liczy się lokalnie w przeglądarce. Klucz i wiadomość nie są wysyłane ani zapisywane.
    </p>
    <label>
      Algorytm
      <select
        class="input"
        :value="algorithm"
        @change="onAlgorithm"
      >
        <option value="SHA-256">
          SHA-256
        </option>
        <option value="SHA-512">
          SHA-512
        </option>
      </select>
    </label>
    <label>
      Klucz
      <textarea
        v-model="key"
        class="input mono"
        rows="3"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <label>
      Wiadomość
      <textarea
        v-model="message"
        class="input mono"
        rows="6"
        spellcheck="false"
        autocomplete="off"
        @keydown.ctrl.enter.prevent="run"
        @keydown.meta.enter.prevent="run"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="run"
    >
      Policz HMAC
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Szesnastkowo
      <textarea
        class="input mono"
        rows="4"
        readonly
        spellcheck="false"
        :value="hex"
      />
    </label>
    <CopyButton :text="hex" />
    <label>
      Base64
      <textarea
        class="input mono"
        rows="3"
        readonly
        spellcheck="false"
        :value="encoded"
      />
    </label>
    <CopyButton :text="encoded" />
  </div>
</template>
