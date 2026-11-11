<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import CommandPalette from './components/CommandPalette.vue'
import { t } from './i18n'

const paletteOpen = ref(false)

function onKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="app">
    <a
      class="skip"
      href="#tresc"
    >{{ t('skip') }}</a>
    <AppHeader @open-search="paletteOpen = true" />
    <main
      id="tresc"
      class="main"
    >
      <RouterView />
    </main>
    <AppFooter />
    <CommandPalette
      v-if="paletteOpen"
      @close="paletteOpen = false"
    />
  </div>
</template>
