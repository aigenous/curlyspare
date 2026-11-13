<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { brand } from '../brand'
import { pageHead } from '../composables/usePageMeta'
import { categoryLabel, t } from '../i18n'
import { findTool } from '../registry'
import { publishedSlugs } from '../registry/published'

const route = useRoute()
const tool = computed(() => findTool(String(route.meta.slug ?? '')))
const draft = computed(() => {
  const current = tool.value
  return Boolean(current && !publishedSlugs.has(current.slug))
})

const AsyncTool = computed(() => {
  const current = tool.value
  if (!current) return null
  return defineAsyncComponent(async () => {
    const loaded = await current.component()
    if (loaded && typeof loaded === 'object' && 'default' in loaded) {
      return (loaded as { default: Component }).default
    }
    return loaded as Component
  })
})

useHead(() => {
  const current = tool.value
  return pageHead({
    title: current ? `${current.title} — ${brand.name}` : brand.name,
    description: current?.description ?? '',
    path: current ? `/${current.slug}` : route.path,
    robots: draft.value ? 'noindex,nofollow' : undefined,
  })
})
</script>

<template>
  <article v-if="tool">
    <p
      v-if="draft"
      class="kicker"
    >
      {{ t('draftBadge') }}
    </p>
    <p class="kicker">
      {{ categoryLabel(tool.category) }}
    </p>
    <h1>{{ tool.title }}</h1>
    <p class="lede">
      {{ tool.description }}
    </p>
    <div class="panel">
      <component
        :is="AsyncTool"
        v-if="AsyncTool"
      />
    </div>
    <p
      v-if="tool.disclaimer"
      class="disclaimer"
    >
      {{ tool.disclaimer }}
    </p>
  </article>
</template>
