<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { brand } from '../brand'
import { pageHead } from '../composables/usePageMeta'
import { categoryLabel } from '../i18n'
import { findTool } from '../registry'
import IdDocumentGuide from '../tools/generators/IdDocumentGuide.vue'
import { ID_TEST_NOTICE_LINES, documentTitleFor, idDocumentPage } from '../tools/generators/id-document-copy'

const route = useRoute()
const tool = computed(() => findTool(String(route.meta.slug ?? '')))
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
  })
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
    <component
      :is="idCopy ? 'section' : 'div'"
      :class="idCopy ? 'tool panel' : 'panel'"
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
    </component>
    <p
      v-if="tool.disclaimer"
      class="disclaimer"
    >
      {{ tool.disclaimer }}
    </p>
    <IdDocumentGuide
      v-if="idCopy"
      :page="idCopy"
    />
  </article>
</template>
