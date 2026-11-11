<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta'
import { brand } from '../brand'
import { t } from '../i18n'

usePageMeta({
  title: `${t('notFoundTitle')} — ${brand.name}`,
  description: t('notFoundBody'),
  path: '/404',
  robots: 'noindex',
})
</script>

<template>
  <article>
    <h1>{{ t('notFoundTitle') }}</h1>
    <p>{{ t('notFoundBody') }}</p>
    <RouterLink to="/">{{ t('notFoundHome') }}</RouterLink>
  </article>
</template>
