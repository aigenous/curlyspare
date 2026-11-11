<script setup lang="ts">
import { computed, ref } from 'vue'
import { chmodFromOctal, chmodFromSymbolic } from '../../lib/misc/chmod'

const octal = ref('0755')
const symbolic = ref('rwxr-xr-x')
const error = ref('')
const parsed = computed(() => chmodFromOctal(octal.value))

function onOctal() {
  const result = chmodFromOctal(octal.value)
  if (!result.ok) {
    error.value = result.error
    return
  }
  error.value = ''
  symbolic.value = result.mode.symbolic
  octal.value = result.mode.octal
}

function onSymbolic() {
  const result = chmodFromSymbolic(symbolic.value)
  if (!result.ok) {
    error.value = result.error
    return
  }
  error.value = ''
  octal.value = result.mode.octal
  symbolic.value = result.mode.symbolic
}
</script>

<template>
  <div class="stack">
    <label>
      Zapis ósemkowy
      <input
        v-model="octal"
        class="input mono"
        inputmode="numeric"
        spellcheck="false"
        @change="onOctal"
      >
    </label>
    <label>
      Zapis symboliczny
      <input
        v-model="symbolic"
        class="input mono"
        spellcheck="false"
        @change="onSymbolic"
      >
    </label>
    <p
      v-if="error"
      class="message-error"
      role="alert"
    >
      {{ error }}
    </p>
    <dl
      v-else-if="parsed.ok"
      class="stats"
    >
      <div>
        <dt>Ósemkowo</dt>
        <dd>{{ parsed.mode.octal }}</dd>
      </div>
      <div>
        <dt>Symbolicznie</dt>
        <dd>{{ parsed.mode.symbolic }}</dd>
      </div>
      <div>
        <dt>Bity specjalne</dt>
        <dd>{{ parsed.mode.setuid ? 'setuid ' : '' }}{{ parsed.mode.setgid ? 'setgid ' : '' }}{{ parsed.mode.sticky ? 'sticky' : '' }}{{ !parsed.mode.setuid && !parsed.mode.setgid && !parsed.mode.sticky ? 'brak' : '' }}</dd>
      </div>
    </dl>
    <p class="hint">
      4 to odczyt, 2 zapis, 1 wykonanie. Czwarta cyfra od lewej: 4 setuid, 2 setgid, 1 sticky.
    </p>
  </div>
</template>
