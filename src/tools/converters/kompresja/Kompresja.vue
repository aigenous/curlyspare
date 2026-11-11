<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { compressToBase64, decompressFromBase64, isCompressionFormat, type CompressionFormat } from '../../../lib/converters/compress'

const format = ref<CompressionFormat>('gzip')
const source = ref('')
const output = ref('')
const error = ref('')

function onFormat(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isCompressionFormat(value)) format.value = value
}

async function show(compress: boolean): Promise<void> {
  const result = compress
    ? await compressToBase64(source.value, format.value)
    : await decompressFromBase64(source.value, format.value)
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
    <p class="hint">
      Kompresja korzysta z CompressionStream w przeglądarce. Wynik to Base64.
    </p>
    <label>
      Format
      <select
        class="input"
        :value="format"
        @change="onFormat"
      >
        <option value="gzip">
          gzip
        </option>
        <option value="deflate">
          deflate
        </option>
      </select>
    </label>
    <label>
      Tekst albo Base64
      <textarea
        v-model="source"
        class="input mono"
        rows="8"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <div class="row">
      <button
        class="button"
        type="button"
        @click="show(true)"
      >
        Kompresuj
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(false)"
      >
        Rozpakuj
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
        rows="8"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
