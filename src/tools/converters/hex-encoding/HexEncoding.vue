<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { decodeHex, encodeHex, encodeHexBytes } from '../../../lib/converters/hex'
import { readInputFile } from '../browser'

const source = ref('')
const output = ref('')
const error = ref('')
const uppercase = ref(false)

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
  const bytes = await readInputFile(event.target)
  if (!bytes.ok) {
    show(bytes)
    return
  }
  error.value = ''
  output.value = encodeHexBytes(bytes.value, uppercase.value)
}
</script>

<template>
  <div class="stack">
    <label>
      Tekst albo hex
      <textarea
        v-model="source"
        class="input mono"
        rows="8"
        spellcheck="false"
        autocomplete="off"
      />
    </label>
    <label>
      <input
        v-model="uppercase"
        type="checkbox"
      >
      Wielkie litery
    </label>
    <div class="row">
      <button
        class="button"
        type="button"
        @click="show({ ok: true, value: encodeHex(source, uppercase) })"
      >
        Koduj tekst
      </button>
      <button
        class="button-ghost"
        type="button"
        @click="show(decodeHex(source))"
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
