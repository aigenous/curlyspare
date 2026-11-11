<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { brand } from '../brand'
import { t } from '../i18n'

const emit = defineEmits<{ openSearch: [] }>()
const { toggle } = useTheme()
</script>

<template>
  <header class="header">
    <RouterLink
      class="brand"
      to="/"
    >{{ brand.name }}</RouterLink>
    <div class="header-actions">
      <button
        class="button-ghost"
        type="button"
        @click="emit('openSearch')"
      >
        {{ t('search') }}
        <kbd>Ctrl+K</kbd>
      </button>
      <button
        class="button-ghost"
        type="button"
        :aria-label="t('theme')"
        @click="toggle"
      >
        <span
          class="theme-icon"
          aria-hidden="true"
        />
      </button>
    </div>
  </header>
</template>
