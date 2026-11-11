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
        paragraphs: [
          'Serwis udostępnia narzędzia uruchamiane w przeglądarce. Wyniki służą do testowania oprogramowania.',
          'Numery generowane przez serwis mają tylko poprawną sumę kontrolną. Nie wolno używać ich do podszywania się pod inne osoby ani w dokumentach, formularzach urzędowych, bankowych lub finansowych.',
          'Walidacja sprawdza wyłącznie sumę kontrolną w tej przeglądarce. Serwis nie odpytuje rejestrów GUS, KRS, CEIDG ani wykazu podatników VAT i nie generuje numerów kart płatniczych.',
        ],
      }
    case 'privacy':
      return {
        title: t('privacyTitle'),
        description: t('privacyDescription'),
        path: '/polityka-prywatnosci',
        paragraphs: [
          `Administratorem jest ${brand.operator.name}, ${brand.operator.legalForm}, NIP ${brand.operator.nip}, e-mail ${brand.operator.email}.`,
          'Wpisane i wygenerowane wartości są liczone lokalnie i nie są wysyłane na serwer. Serwis nie prowadzi kont, analityki, reklam ani ciasteczek.',
          'Przeglądarka może zapisać w localStorage wyłącznie motyw jasny albo ciemny. Wygenerowane identyfikatory i treść narzędzi nie są zapisywane.',
        ],
      }
    case 'operator':
      return {
        title: t('operatorTitle'),
        description: t('operatorDescription'),
        path: '/operator',
        paragraphs: [
          `${brand.operator.name}, ${brand.operator.legalForm}.`,
          `NIP: ${brand.operator.nip}. E-mail: ${brand.operator.email}.`,
          `${brand.name} jest nazwą roboczą i może zostać zmieniona. Adres siedziby uzupełni operator.`,
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
