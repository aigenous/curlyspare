<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseUserAgent } from '../../lib/misc/useragent'

const input = ref(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
)
const info = computed(() => parseUserAgent(input.value))

function useBrowser() {
  input.value = navigator.userAgent
}
</script>

<template>
  <div class="stack">
    <label>
      User-Agent
      <textarea
        v-model="input"
        class="input mono"
        rows="5"
        spellcheck="false"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="useBrowser"
    >
      Wstaw nagłówek tej przeglądarki
    </button>
    <dl class="stats">
      <div>
        <dt>Przeglądarka</dt>
        <dd>{{ info.browser }} {{ info.browserVersion }}</dd>
      </div>
      <div>
        <dt>System</dt>
        <dd>{{ info.os }} {{ info.osVersion }}</dd>
      </div>
      <div>
        <dt>Urządzenie</dt>
        <dd>{{ info.device }}</dd>
      </div>
    </dl>
    <p class="hint">
      Odczyt jest przybliżony. Nagłówek zostaje w przeglądarce.
    </p>
  </div>
</template>
