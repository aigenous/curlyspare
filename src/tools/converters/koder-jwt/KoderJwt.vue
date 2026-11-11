<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { isJwtSignAlg, signJwt, type JwtSignAlg } from '../../../lib/converters/jwt-sign'

const alg = ref<JwtSignAlg>('HS256')
const secret = ref('')
const header = ref('')
const payload = ref('{\n  "sub": "użytkownik"\n}')
const output = ref('')
const error = ref('')

function onAlg(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isJwtSignAlg(value)) alg.value = value
}

async function run(): Promise<void> {
  const result = await signJwt(payload.value, secret.value, alg.value, header.value)
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
      Algorytm
      <select
        class="input"
        :value="alg"
        @change="onAlg"
      >
        <option value="HS256">
          HS256
        </option>
        <option value="HS384">
          HS384
        </option>
        <option value="HS512">
          HS512
        </option>
      </select>
    </label>
    <label>
      Sekret
      <input
        v-model="secret"
        class="input mono"
        type="password"
        autocomplete="off"
        spellcheck="false"
      >
    </label>
    <label>
      Nagłówek JSON (opcjonalnie)
      <textarea
        v-model="header"
        class="input mono"
        rows="3"
        spellcheck="false"
        autocomplete="off"
        placeholder="opcjonalnie, na przykład kid"
      />
    </label>
    <label>
      Payload JSON
      <textarea
        v-model="payload"
        class="input mono"
        rows="8"
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
      Podpisz
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Token
      <textarea
        class="input mono"
        rows="5"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
