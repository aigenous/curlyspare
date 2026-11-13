<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { t } from '../../i18n'
import { browserPrivacy } from '../../lib/landing/copy'
import { primaryGroupFor, relatedInGroup } from '../../registry/catalogue'
import { publicTools } from '../../registry/published'
import { structureTableFor } from '../../registry/tool-structure'
import type { ToolDefinition } from '../../registry/types'
import ResponsiveTable from './ResponsiveTable.vue'
import ToolNotice from './ToolNotice.vue'

const props = defineProps<{
  tool: ToolDefinition
  draft: boolean
}>()

const group = computed(() => primaryGroupFor(props.tool.slug))
const structure = computed(() => structureTableFor(props.tool.slug))
const related = computed(() => relatedInGroup(props.tool.slug, publicTools()))
</script>

<template>
  <div class="wrap tool-page">
    <header class="tool-head">
      <p
        v-if="draft"
        class="kicker"
      >
        {{ t('draftBadge') }}
      </p>
      <nav aria-label="Okruszki">
        <ol class="crumbs">
          <li>
            <RouterLink to="/#narzedzia">
              Narzędzia
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="`/#${group.anchor}`">
              {{ group.label }}
            </RouterLink>
          </li>
          <li aria-current="page">
            {{ tool.title }}
          </li>
        </ol>
      </nav>
      <h1 class="h1">
        {{ tool.title }}
      </h1>
      <p class="lead">
        {{ tool.description }}
      </p>
    </header>

    <div class="tool-body stack stack--lg">
      <section class="tool">
        <slot />
      </section>
      <ToolNotice
        v-if="tool.disclaimer"
        :text="tool.disclaimer"
      />
      <p class="lead-mobile">
        {{ tool.description }}
      </p>
      <article
        v-if="structure"
        class="prose"
      >
        <h2 class="h2">
          {{ structure.caption }}
        </h2>
        <ResponsiveTable :table="structure" />
        <p v-if="structure.note">
          {{ structure.note }}
        </p>
      </article>
      <slot name="after" />
    </div>

    <aside class="tool-side">
      <section
        class="stack"
        aria-labelledby="dane-h"
      >
        <h2
          id="dane-h"
          class="h3"
        >
          Co dzieje się z danymi
        </h2>
        <p class="small">
          {{ browserPrivacy }}
        </p>
      </section>
      <nav
        v-if="related.length > 0"
        class="stack"
        aria-labelledby="powiazane-h"
      >
        <h2
          id="powiazane-h"
          class="h3"
        >
          Powiązane narzędzia
        </h2>
        <ul class="foot-links">
          <li
            v-for="link in related"
            :key="link.slug"
          >
            <RouterLink :to="`/${link.slug}`">
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>
