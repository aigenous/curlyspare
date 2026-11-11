<script setup lang="ts">
import { ref } from 'vue'
import ClientOnly from '../../components/ClientOnly.vue'
import { renderMarkdown } from '../../lib/misc/markdown'

const source = ref('# Nagłówek\n\n**Pogrubienie** i [link](https://example.com).\n\n- punkt\n')
</script>

<template>
  <div class="stack">
    <label>
      Markdown
      <textarea
        v-model="source"
        class="input mono"
        rows="10"
        spellcheck="false"
      />
    </label>
    <p class="hint">
      Podgląd jest czyszczony w przeglądarce. Skrypty i atrybuty zdarzeń są usuwane.
    </p>
    <ClientOnly>
      <!-- eslint-disable vue/no-v-html -- DOMPurify removes scripts and event handlers before insertion. -->
      <div
        class="preview md"
        role="region"
        aria-label="Podgląd HTML"
        v-html="renderMarkdown(source)"
      />
      <!-- eslint-enable vue/no-v-html -->
      <template #fallback>
        <pre class="preview">{{ source }}</pre>
      </template>
    </ClientOnly>
  </div>
</template>
