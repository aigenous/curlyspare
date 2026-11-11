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
      <!-- DOMPurify removes scripts and event handlers before this HTML is inserted. -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        class="preview md"
        v-html="renderMarkdown(source)"
      />
      <template #fallback>
        <pre class="preview">{{ source }}</pre>
      </template>
    </ClientOnly>
  </div>
</template>
