<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { curlToCode } from '../../../lib/converters/curl'

const source = ref('')
const fetchCode = ref('')
const axiosCode = ref('')
const error = ref('')

function run(): void {
  const result = curlToCode(source.value)
  if (!result.ok) {
    fetchCode.value = ''
    axiosCode.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  fetchCode.value = result.value.fetch
  axiosCode.value = result.value.axios
}
</script>

<template>
  <div class="stack">
    <p class="hint">
      Parser czyta metodę, adres, nagłówki, treść, -G, --json i podstawowe uwierzytelnienie.
    </p>
    <label>
      Polecenie curl
      <textarea
        v-model="source"
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
      Zamień
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      fetch
      <textarea
        class="input mono"
        rows="8"
        readonly
        spellcheck="false"
        :value="fetchCode"
      />
    </label>
    <CopyButton :text="fetchCode" />
    <label>
      axios
      <textarea
        class="input mono"
        rows="8"
        readonly
        spellcheck="false"
        :value="axiosCode"
      />
    </label>
    <CopyButton :text="axiosCode" />
  </div>
</template>
