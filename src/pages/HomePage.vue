<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { usePageMeta } from '../composables/usePageMeta'
import { brand } from '../brand'
import { categoryLabel, t } from '../i18n'
import { filterTools } from '../lib/search'
import { categories } from '../registry'
import { publicTools, publishedSlugs } from '../registry/published'

const query = ref('')
const visible = computed(() => filterTools(publicTools(), query.value))
const groups = computed(() =>
  categories.flatMap((category) => {
    const items = visible.value.filter((tool) => tool.category === category)
    return items.length > 0 ? [{ category, items }] : []
  }),
)

usePageMeta({
  title: `${t('homeTitle')} — ${brand.name}`,
  description: t('homeLede'),
  path: '/',
})

function isDraft(slug: string): boolean {
  return !publishedSlugs.has(slug)
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
      role="status"
    >
      {{ query.trim() ? t('homeNoResults') : t('homeEmpty') }}
    </p>
    <section
      v-for="group in groups"
      :key="group.category"
      class="category"
    >
      <h2 :id="group.category">
        {{ categoryLabel(group.category) }}
        <span class="count">({{ group.items.length }})</span>
      </h2>
      <ul class="tool-grid">
        <li
          v-for="tool in group.items"
          :key="tool.slug"
        >
          <RouterLink
            class="tool-card"
            :to="`/${tool.slug}`"
          >
            <p
              v-if="isDraft(tool.slug)"
              class="kicker"
            >
              {{ t('draftBadge') }}
            </p>
            <h3>{{ tool.title }}</h3>
            <p>{{ tool.description }}</p>
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>
