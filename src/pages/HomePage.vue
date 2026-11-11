<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta'
import { brand } from '../brand'
import { categoryLabel, t } from '../i18n'
import { filterTools } from '../lib/search'
import { categories, tools } from '../registry'

const query = ref('')
const visible = computed(() => filterTools(tools, query.value))

usePageMeta({
  title: `${t('homeTitle')} — ${brand.name}`,
  description: t('homeLede'),
  path: '/',
})

function inCategory(category: (typeof categories)[number]) {
  return visible.value.filter((tool) => tool.category === category)
}
</script>

<template>
  <section>
    <p class="kicker">
      {{ t('homeKicker') }}
    </p>
    <h1>{{ t('homeTitle') }}</h1>
    <p class="lede">
      {{ t('homeLede') }}
    </p>
    <label class="search">
      {{ t('searchLabel') }}
      <input
        v-model="query"
        class="input"
        type="search"
        :placeholder="t('searchPlaceholder')"
      >
    </label>
    <p
      v-if="visible.length === 0"
      class="muted"
    >
      {{ t('homeEmpty') }}
    </p>
    <section
      v-for="category in categories"
      :key="category"
      class="category"
    >
      <template v-if="inCategory(category).length">
        <h2 :id="category">
          {{ categoryLabel(category) }}
          <span class="count">({{ inCategory(category).length }})</span>
        </h2>
        <ul class="tool-grid">
          <li
            v-for="tool in inCategory(category)"
            :key="tool.slug"
          >
            <RouterLink
              class="tool-card"
              :to="`/${tool.slug}`"
            >
              <h3>{{ tool.title }}</h3>
              <p>{{ tool.description }}</p>
            </RouterLink>
          </li>
        </ul>
      </template>
    </section>
  </section>
</template>
