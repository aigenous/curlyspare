<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useToast } from '../composables/useToast'

const props = defineProps<{ text: string }>()

type CopyState = 'idle' | 'copied' | 'failed'

const state = ref<CopyState>('idle')
const toast = useToast()
let timer = 0

const canCopy = computed(() => props.text.length > 0)

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
  if (!canCopy.value) return
  window.clearTimeout(timer)
  try {
    await navigator.clipboard.writeText(props.text)
    state.value = 'copied'
    toast.show('Skopiowano do schowka')
  } catch {
    state.value = 'failed'
    toast.show('Nie udało się skopiować. Zaznacz tekst i użyj Ctrl+C.')
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
    :disabled="!canCopy"
    @click="copy"
  >
    {{ label }}
  </button>
</template>
