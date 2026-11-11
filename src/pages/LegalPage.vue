<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { brand } from '../brand'
import { pageHead } from '../composables/usePageMeta'
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
        paragraphs: [] as string[],
      }
    default: {
      const unreachable: never = page.value
      return unreachable
    }
  }
})

const contactEmail = `mailto:${brand.operator.email}`

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
  <article>
    <h1>{{ copy.title }}</h1>
    <p
      v-for="(paragraph, index) in copy.paragraphs"
      :key="index"
    >
      {{ paragraph }}
    </p>
    <dl
      v-if="page === 'operator'"
      class="operator-details"
    >
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
        <dt>Adres korespondencyjny</dt>
        <dd>{{ brand.operator.correspondenceAddress }}</dd>
      </div>
      <div>
        <dt>Adres e-mail do kontaktu</dt>
        <dd>
          <a :href="contactEmail">{{ brand.operator.email }}</a>
        </dd>
      </div>
    </dl>
  </article>
</template>
