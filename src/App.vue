<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import CommandPalette from './components/CommandPalette.vue'
import Toast from './components/Toast.vue'
import { usePalette } from './composables/usePalette'
import { t } from './i18n'

const palette = usePalette()

function onKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    palette.show()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="site">
    <a
      class="skip"
      href="#tresc"
    >{{ t('skip') }}</a>
    <AppHeader />
    <main id="tresc">
      <RouterView />
    </main>
    <AppFooter />
    <CommandPalette
      v-if="palette.open.value"
      @close="palette.hide()"
    />
    <Toast />
  </div>
</template>
