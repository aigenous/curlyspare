<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { brand } from '../brand'
import { t } from '../i18n'

type LegalPageId = 'terms' | 'privacy' | 'operator'

const route = useRoute()
const page = computed(() => route.meta.page as LegalPageId)

const copy = computed(() => {
  switch (page.value) {
    case 'terms':
      return {
        title: t('termsTitle'),
        description: t('termsDescription'),
        path: '/regulamin',
        paragraphs: ['Placeholder. Treść regulaminu zostanie uzupełniona.'],
      }
    case 'privacy':
      return {
        title: t('privacyTitle'),
        description: t('privacyDescription'),
        path: '/polityka-prywatnosci',
        paragraphs: ['Placeholder. Treść polityki prywatności zostanie uzupełniona.'],
      }
    case 'operator':
      return {
        title: t('operatorTitle'),
        description: t('operatorDescription'),
        path: '/operator',
        paragraphs: [
          `Placeholder. ${brand.operator.name}, ${brand.operator.legalForm}, NIP ${brand.operator.nip}, ${brand.operator.email}.`,
        ],
      }
    default: {
      const unreachable: never = page.value
      return unreachable
    }
  }
})

useHead(() => {
  const current = copy.value
  const url = `${brand.siteUrl}${current.path}`
  const title = `${current.title} — ${brand.name}`
  return {
    title,
    meta: [
      { name: 'description', content: current.description },
      { property: 'og:title', content: title },
      { property: 'og:url', content: url },
    ],
    link: [{ rel: 'canonical', href: url }],
  }
})
</script>

<template>
  <article>
    <h1>{{ copy.title }}</h1>
    <p
      v-for="(paragraph, index) in copy.paragraphs"
      :key="index"
    >
      {{ paragraph }}
    </p>
  </article>
</template>
