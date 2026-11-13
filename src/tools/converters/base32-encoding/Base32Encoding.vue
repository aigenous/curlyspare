<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { decodeBase32, encodeBase32, encodeBase32Bytes } from '../../../lib/converters/base32'
import { readInputFile } from '../browser'

const source = ref('')
const output = ref('')
const error = ref('')

function show(result: { ok: true; value: string } | { ok: false; error: string }): void {
  if (!result.ok) {
    output.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  output.value = result.value
}

async function encodeFile(event: Event): Promise<void> {
  const bytes = await readInputFile((event.target as HTMLInputElement))
  if (!bytes.ok) {
    show(bytes)
    return
  }
  error.value = ''
  output.value = encodeBase32Bytes(bytes.value)
}
</script>

<template>
  <div class="stack">
    <label>
      Tekst albo Base32
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
        @click="show({ ok: true, value: encodeBase32(source) })"
      >
        Koduj tekst
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(decodeBase32(source))"
      >
        Dekoduj tekst
      </button>
    </div>
    <label>
      Koduj plik
      <input
        class="input"
        type="file"
        @change="encodeFile"
      >
    </label>
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
