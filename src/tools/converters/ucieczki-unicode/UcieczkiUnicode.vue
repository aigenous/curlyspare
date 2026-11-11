<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import {
  escapeUnicode,
  formatCodePoints,
  isUnicodeEscapeStyle,
  unescapeUnicode,
  type UnicodeEscapeStyle,
} from '../../../lib/converters/unicode'
import { encodeHex } from '../../../lib/converters/hex'

const source = ref('')
const style = ref<UnicodeEscapeStyle>('uXXXX')
const output = ref('')
const error = ref('')
const points = computed(() => formatCodePoints(source.value))
const utf8 = computed(() => encodeHex(source.value))

function onStyle(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isUnicodeEscapeStyle(value)) style.value = value
}

function escape(): void {
  error.value = ''
  output.value = escapeUnicode(source.value, style.value)
}

function unescape(): void {
  const result = unescapeUnicode(source.value)
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
  <div class="stack">
    <label>
      Tekst
      <textarea
        v-model="source"
        class="input mono"
        rows="6"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <label>
      Zapis ucieczki
      <select
        class="input"
        :value="style"
        @change="onStyle"
      >
        <option value="uXXXX">
          \uXXXX (pary zastępcze)
        </option>
        <option value="codepoint">
          \u{punkt kodowy}
        </option>
      </select>
    </label>
    <div class="row">
      <button
        class="button"
        type="button"
        @click="escape"
      >
        Ucieknij
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="unescape"
      >
        Odczytaj
      </button>
    </div>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Wynik
      <textarea
        class="input mono"
        rows="5"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
    <label>
      Punkty kodowe (U+, liczba, bajty UTF-8, znak)
      <textarea
        class="input mono"
        rows="6"
        readonly
        spellcheck="false"
        :value="points"
      />
    </label>
    <label>
      Cały tekst jako bajty UTF-8
      <input
        class="input mono"
        readonly
        spellcheck="false"
        :value="utf8"
      >
    </label>
    <CopyButton :text="utf8" />
  </div>
</template>
