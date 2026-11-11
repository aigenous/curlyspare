<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { polishLorem } from '../../lib/misc/lorem'

const paragraphs = ref(2)
const sentences = ref(3)
const output = ref(polishLorem(2, 3))

function generate() {
  output.value = polishLorem(paragraphs.value, sentences.value)
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Akapity
        <input
          v-model.number="paragraphs"
          class="input"
          type="number"
          min="1"
          max="12"
        >
      </label>
      <label>
        Zdania w akapicie
        <input
          v-model.number="sentences"
          class="input"
          type="number"
          min="1"
          max="8"
        >
      </label>
    </div>
    <button
      class="button"
      type="button"
      @click="generate"
    >
      Generuj
    </button>
    <textarea
      class="input"
      rows="10"
      readonly
      :value="output"
    />
    <CopyButton :text="output" />
  </div>
</template>
