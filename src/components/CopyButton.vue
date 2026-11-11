<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ text: string }>()

type CopyState = 'idle' | 'copied' | 'failed'

const state = ref<CopyState>('idle')
let timer = 0

const label = computed(() => {
  switch (state.value) {
    case 'idle':
      return 'Kopiuj'
    case 'copied':
      return 'Skopiowano'
    case 'failed':
      return 'Nie udało się skopiować'
    default: {
      const unreachable: never = state.value
      return unreachable
    }
  }
})

async function copy() {
  window.clearTimeout(timer)
  try {
    await navigator.clipboard.writeText(props.text)
    state.value = 'copied'
  } catch {
    state.value = 'failed'
  }
  timer = window.setTimeout(() => {
    state.value = 'idle'
  }, 1600)
}

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <button
    class="button-ghost"
    type="button"
    aria-live="polite"
    @click="copy"
  >
    {{ label }}
  </button>
</template>
