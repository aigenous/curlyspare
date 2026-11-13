<script setup lang="ts">
import { usePageMeta } from '../composables/usePageMeta'
import { brand } from '../brand'

usePageMeta({
  title: `Licencje — ${brand.name}`,
  description: 'Licencje krojów pisma i bibliotek użytych w serwisie CurlySpare.',
  path: '/licencje',
})

const googleFontsCommit = '3e5667764ccfea32ce0c3d58a3a4756de890adc1'

const families = [
  {
    name: 'Poltawski Nowy',
    copyright:
      'Copyright 2020 The Poltawski Nowy Project Authors (https://github.com/kosmynkab/Poltawski-Nowy)',
    upstream: 'https://github.com/kosmynkab/Poltawski-Nowy',
    commit: '4d541846c51c5267937a06fd5da9ab7837be166f',
    files: ['poltawski-nowy-700-latin.woff2', 'poltawski-nowy-700-latin-ext.woff2'],
  },
  {
    name: 'Atkinson Hyperlegible Next',
    copyright:
      'Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next)',
    upstream: 'https://github.com/googlefonts/atkinson-hyperlegible-next',
    commit: '7925f50f649b3813257faf2f4c0b381011f434f1',
    files: [
      'atkinson-hyperlegible-next-400-latin.woff2',
      'atkinson-hyperlegible-next-400-latin-ext.woff2',
      'atkinson-hyperlegible-next-600-latin.woff2',
      'atkinson-hyperlegible-next-600-latin-ext.woff2',
      'atkinson-hyperlegible-next-700-latin.woff2',
      'atkinson-hyperlegible-next-700-latin-ext.woff2',
      'atkinson-hyperlegible-next-400-italic-latin.woff2',
      'atkinson-hyperlegible-next-400-italic-latin-ext.woff2',
    ],
  },
  {
    name: 'Atkinson Hyperlegible Mono',
    copyright:
      'Copyright 2020-2024 The Atkinson Hyperlegible Mono Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next-mono)',
    upstream: 'https://github.com/googlefonts/atkinson-hyperlegible-next-mono',
    commit: '154d50362016cc3e873eb21d242cd0772384c8f9',
    files: [
      'atkinson-hyperlegible-mono-400-latin.woff2',
      'atkinson-hyperlegible-mono-400-latin-ext.woff2',
      'atkinson-hyperlegible-mono-700-latin.woff2',
      'atkinson-hyperlegible-mono-700-latin-ext.woff2',
    ],
  },
] as const
</script>

<template>
  <article class="wrap prose">
    <h1 class="h1">
      Licencje
    </h1>
    <p>
      Kroje pisma są osadzone w serwisie (pliki WOFF2, SIL Open Font License 1.1). Pełne teksty
      licencji i wykaz bibliotek npm są w
      <a href="/THIRD-PARTY-LICENSES.txt">THIRD-PARTY-LICENSES.txt</a>.
    </p>
    <p>
      Źródłowe pliki zmiennych pochodzą z
      <a href="https://github.com/google/fonts">google/fonts</a>
      w commicie {{ googleFontsCommit }}.
    </p>
    <section
      v-for="family in families"
      :key="family.name"
    >
      <h2 class="h2">
        {{ family.name }}
      </h2>
      <p>{{ family.copyright }}</p>
      <p>
        Upstream:
        <a :href="family.upstream">{{ family.upstream }}</a>
        @ {{ family.commit }}
      </p>
      <ul>
        <li
          v-for="file in family.files"
          :key="file"
        >
          {{ file }}
        </li>
      </ul>
    </section>
  </article>
</template>
