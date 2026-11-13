<script lang="ts">
import { marked } from 'marked'
import { applyOperatorFields } from '../lib/operatorLaunch'

export function renderLegal(source: string): string {
  const withOperator = applyOperatorFields(source)
  const normalized = withOperator
    .replace(
      /^(## 8\. Informacja o cookies i pamięci przeglądarki) \{#cookies\}\s*$/m,
      '$1',
    )
    .replace(/<!--[\s\S]*?-->/g, '')
  const parsed = marked.parse(normalized, { async: false, gfm: true })
  if (typeof parsed !== 'string') return ''
  return parsed.replace(
    '<h2>8. Informacja o cookies i pamięci przeglądarki</h2>',
    '<h2 id="cookies">8. Informacja o cookies i pamięci przeglądarki</h2>',
  )
}
</script>

<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { brand } from '../brand'
import { pageHead } from '../composables/usePageMeta'
import { t } from '../i18n'
import privacySource from '../content/legal/privacy-policy.md?raw'
import termsSource from '../content/legal/regulamin.md?raw'

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
        html: renderLegal(termsSource),
      }
    case 'privacy':
      return {
        title: t('privacyTitle'),
        description: t('privacyDescription'),
        path: '/polityka-prywatnosci',
        html: renderLegal(privacySource),
      }
    case 'operator':
      return {
        title: t('operatorTitle'),
        description: t('operatorDescription'),
        path: '/operator',
        html: '',
      }
    default: {
      const unreachable: never = page.value
      return unreachable
    }
  }
})

useHead(() => {
  const current = copy.value
  return pageHead({
    title: `${current.title} — ${brand.name}`,
    description: current.description,
    path: current.path,
  })
})
</script>

<template>
  <article class="wrap prose">
    <!-- eslint-disable vue/no-v-html -- Lawyer markdown is a build-time file, not user input. -->
    <div
      v-if="copy.html"
      v-html="copy.html"
    />
    <!-- eslint-enable vue/no-v-html -->
    <template v-if="page === 'operator'">
      <h1 class="h1">
        {{ copy.title }}
      </h1>
      <dl class="operator-details">
        <div>
          <dt>Operator</dt>
          <dd>{{ brand.operator.name }}</dd>
        </div>
        <div>
          <dt>Forma prawna</dt>
          <dd>{{ brand.operator.legalForm }}</dd>
        </div>
        <div>
          <dt>NIP</dt>
          <dd>{{ brand.operator.nip }}</dd>
        </div>
        <div>
          <dt>REGON</dt>
          <dd>{{ brand.operator.regon }}</dd>
        </div>
        <div>
          <dt>Adres</dt>
          <dd>{{ brand.operator.correspondenceAddress }}</dd>
        </div>
        <div>
          <dt>Adres e-mail do kontaktu</dt>
          <dd>{{ brand.operator.email }}</dd>
        </div>
      </dl>
    </template>
  </article>
</template>
