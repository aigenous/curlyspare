<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ text: string }>()
const copied = ref(false)
let timer = 0

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
  } catch {
    const area = document.createElement('textarea')
    area.value = props.text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.append(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <button
    class="button-ghost"
    type="button"
    @click="copy"
  >
    {{ copied ? 'Skopiowano' : 'Kopiuj' }}
  </button>
</template>
