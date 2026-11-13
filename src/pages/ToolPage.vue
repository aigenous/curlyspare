<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { brand } from '../brand'
import ToolPageFrame from '../components/tool/ToolPageFrame.vue'
import { pageHead } from '../composables/usePageMeta'
import { findTool } from '../registry'
import { publishedSlugs } from '../registry/published'
import IdDocumentGuide from '../tools/generators/IdDocumentGuide.vue'
import { ID_TEST_NOTICE_LINES, documentTitleFor, idDocumentPage } from '../tools/generators/id-document-copy'

const route = useRoute()
const tool = computed(() => findTool(String(route.meta.slug ?? '')))
const draft = computed(() => {
  const current = tool.value
  return Boolean(current && !publishedSlugs.has(current.slug))
})
const idCopy = computed(() => {
  const current = tool.value
  return current ? idDocumentPage(current.slug) : null
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
  const page = current ? idDocumentPage(current.slug) : null
  return pageHead({
    title: page ? documentTitleFor(page) : current ? `${current.title} — ${brand.name}` : brand.name,
    description: page?.metaDescription ?? current?.description ?? '',
    ogTitle: page?.h1,
    path: current ? `/${current.slug}` : route.path,
    robots: draft.value ? 'noindex,nofollow' : undefined,
  })
})
</script>

<template>
  <ToolPageFrame
    v-if="tool"
    :tool="tool"
    :draft="draft"
  >
    <div
      v-if="idCopy"
      class="id-test-notice"
    >
      <p
        v-for="line in ID_TEST_NOTICE_LINES"
        :key="line"
      >
        {{ line }}
      </p>
    </div>
    <component
      :is="AsyncTool"
      v-if="AsyncTool"
    />
    <template #after>
      <IdDocumentGuide
        v-if="idCopy"
        :page="idCopy"
      />
    </template>
  </ToolPageFrame>
</template>
