<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { categoryLabel, t } from '../i18n'
import { filterTools } from '../lib/search'
import { tools } from '../registry'

const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const results = computed(() => filterTools(tools, query.value))

watch(results, () => {
  active.value = 0
})

function close() {
  emit('close')
}

async function go(index = active.value) {
  const tool = results.value[index]
  if (!tool) return
  await router.push(`/${tool.slug}`)
  close()
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (results.value.length === 0) return
    active.value = (active.value + 1) % results.value.length
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (results.value.length === 0) return
    active.value = (active.value - 1 + results.value.length) % results.value.length
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    void go()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  void nextTick(() => input.value?.focus())
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="palette-backdrop"
    @click.self="close"
  >
    <div
      class="palette"
      role="dialog"
      aria-modal="true"
      :aria-label="t('paletteLabel')"
    >
      <input
        ref="input"
        v-model="query"
        type="search"
        :aria-label="t('paletteLabel')"
        :placeholder="t('palettePlaceholder')"
      >
      <ul>
        <li
          v-for="(tool, index) in results"
          :key="tool.slug"
        >
          <button
            type="button"
            :aria-selected="index === active"
            @click="go(index)"
          >
            <strong>{{ tool.title }}</strong>
            <span class="muted"> — {{ categoryLabel(tool.category) }}</span>
          </button>
        </li>
      </ul>
      <p
        v-if="results.length === 0"
        class="muted"
        style="padding: 0 1rem 1rem"
      >
        {{ t('paletteEmpty') }}
      </p>
      <button
        class="button-ghost"
        type="button"
        style="margin: 0 0.6rem 0.6rem"
        @click="close"
      >
        {{ t('paletteClose') }}
      </button>
    </div>
  </div>
</template>
