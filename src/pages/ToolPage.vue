<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { brand } from '../brand'
import { categoryLabel } from '../i18n'
import { findTool } from '../registry'

const route = useRoute()
const tool = computed(() => findTool(String(route.meta.slug ?? '')))

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
  const title = current ? `${current.title} — ${brand.name}` : brand.name
  const description = current?.description ?? ''
  const path = current ? `/${current.slug}` : route.path
  const url = `${brand.siteUrl}${path}`
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
    ],
    link: [{ rel: 'canonical', href: url }],
  }
})
</script>

<template>
  <article v-if="tool">
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
