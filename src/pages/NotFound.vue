<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta'
import { usePalette } from '../composables/usePalette'
import { brand } from '../brand'
import { t } from '../i18n'

const palette = usePalette()

usePageMeta({
  title: `${t('notFoundTitle')} — ${brand.name}`,
  description: t('notFoundBody'),
  path: '/404',
  robots: 'noindex',
})
</script>

<template>
  <div class="wrap notfound">
    <div
      class="anatomy"
      aria-hidden="true"
    >
      <div
        class="anatomy__part"
        style="--n: 3"
      >
        <div class="cells">
          <span class="cell">4</span>
          <span class="cell cell--bad">0</span>
          <span class="cell">4</span>
        </div>
        <span class="brace"><i /><i /><i /><i /></span>
        <span class="anatomy__label">ten adres się nie zgadza</span>
      </div>
    </div>
    <h1 class="h1">
      {{ t('notFoundTitle') }}
    </h1>
    <p class="lead">
      {{ t('notFoundBody') }}
    </p>
    <button
      class="search-trigger search-trigger--lg"
      type="button"
      aria-keyshortcuts="Control+K Meta+K"
      @click="palette.show()"
    >
      <svg
        class="icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="11"
          cy="11"
          r="7"
        />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span>Szukaj narzędzia</span>
      <kbd class="kbd">Ctrl/⌘ K</kbd>
    </button>
    <div class="row">
      <RouterLink
        class="btn btn--primary"
        to="/#narzedzia"
      >
        Otwórz spis narzędzi
      </RouterLink>
    </div>
  </div>
</template>
