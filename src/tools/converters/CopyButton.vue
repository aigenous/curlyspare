<script setup lang="ts">
import { ref } from 'vue'
import { copyText } from './browser'

const props = defineProps<{ text: string }>()
const label = ref('Kopiuj')

async function copy(): Promise<void> {
  const copied = await copyText(props.text)
  label.value = copied ? 'Skopiowano' : 'Nie udało się skopiować'
  window.setTimeout(() => {
    label.value = 'Kopiuj'
  }, 1600)
}
</script>

<template>
  <button
    class="button-ghost"
    type="button"
    :disabled="text === ''"
    @click="copy"
  >
    {{ label }}
  </button>
</template>
