<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LogoMark from './LogoMark.vue'
import { usePalette } from '../composables/usePalette'
import { useTheme } from '../composables/useTheme'
import { brand } from '../brand'
import { t } from '../i18n'

const route = useRoute()
const { show } = usePalette()
const { theme, toggle } = useTheme()
const onHome = computed(() => route.path === '/')
</script>

<template>
  <header class="site-header">
    <div class="wrap site-header__in">
      <RouterLink
        class="logo"
        to="/"
        :aria-label="`${brand.name}, strona główna`"
      >
        <LogoMark />
        <span>{{ brand.name }}</span>
      </RouterLink>
      <nav
        class="site-nav"
        aria-label="Główna"
      >
        <RouterLink
          class="nav-link"
          to="/#narzedzia"
          :aria-current="onHome ? 'page' : undefined"
        >
          Narzędzia
        </RouterLink>
      </nav>
      <div class="site-header__tools">
        <button
          class="search-trigger"
          type="button"
          aria-keyshortcuts="Control+K Meta+K"
          @click="show"
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
          <span>{{ t('search') }}</span>
          <kbd class="kbd">Ctrl/⌘ K</kbd>
        </button>
        <button
          class="btn btn--ghost btn--icon"
          type="button"
          :aria-label="t('theme')"
          :aria-pressed="theme === 'dark'"
          @click="toggle"
        >
          <svg
            class="icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            />
            <path
              d="M12 3a9 9 0 0 1 0 18Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <details class="nav-menu nav-menu--mobile">
          <summary
            class="btn btn--ghost btn--icon"
            aria-label="Menu"
          >
            <svg
              class="icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav
            class="nav-menu__panel"
            aria-label="Menu"
          >
            <RouterLink
              class="nav-link"
              to="/#narzedzia"
              :aria-current="onHome ? 'page' : undefined"
            >
              Narzędzia
            </RouterLink>
          </nav>
        </details>
      </div>
    </div>
  </header>
</template>
