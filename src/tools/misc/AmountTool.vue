<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { amountToWords } from '../../lib/misc/amount'

const input = ref('1234,56')
const result = computed(() => amountToWords(input.value))
const words = computed(() => (result.value.ok ? result.value.words : ''))
</script>

<template>
  <div class="stack">
    <label>
      Kwota PLN
      <input
        v-model="input"
        class="input mono"
        inputmode="decimal"
        spellcheck="false"
        placeholder="1234,56"
      >
    </label>
    <p class="hint">
      Przecinek albo kropka z jedną albo dwiema cyframi rozdziela grosze. Kropki w grupach tysięcy są pomijane.
    </p>
    <p
      v-if="!result.ok"
      class="message-error"
      role="alert"
    >
      {{ result.error }}
    </p>
    <label>
      Słownie
      <textarea
        class="input"
        rows="4"
        readonly
        :value="words"
      />
    </label>
    <CopyButton :text="words" />
  </div>
</template>
