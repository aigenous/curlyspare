<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { categoryLabel, t } from '../i18n'
import { filterTools } from '../lib/search'
import { publicTools } from '../registry/published'

const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const results = computed(() => filterTools(publicTools(), query.value))
const listId = 'palette-listbox'
const activeId = computed(() => {
  const tool = results.value[active.value]
  return tool ? `palette-option-${tool.slug}` : undefined
})

let restoreFocus: HTMLElement | null = null

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

function move(delta: number) {
  const count = results.value.length
  if (count === 0) return
  active.value = (active.value + delta + count) % count
  const id = activeId.value
  if (!id) return
  const option = document.getElementById(id)
  if (option && typeof option.scrollIntoView === 'function') {
    option.scrollIntoView({ block: 'nearest' })
  }
}

function trapFocus(event: KeyboardEvent) {
  const root = dialog.value
  if (!root) return
  const focusable = [...root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
  )].filter((element) => element.tabIndex >= 0)
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  event.preventDefault()
  if (!first || !last) return
  const current = document.activeElement
  const index = current instanceof HTMLElement ? focusable.indexOf(current) : -1
  if (event.shiftKey) {
    const previous = index <= 0 ? last : focusable[index - 1]
    previous?.focus()
    return
  }
  const next = index === -1 || index >= focusable.length - 1 ? first : focusable[index + 1]
  next?.focus()
}

function onDialogKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'Tab') {
    trapFocus(event)
    return
  }
  if (event.target !== input.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    void go()
  }
}

onMounted(() => {
  const current = document.activeElement
  restoreFocus = current instanceof HTMLElement && current !== document.body ? current : null
  void nextTick(() => input.value?.focus())
})

onBeforeUnmount(() => {
  if (restoreFocus?.isConnected) restoreFocus.focus()
})
</script>

<template>
  <div
    class="cmdk-layer"
    @click.self="close"
  >
    <div
      ref="dialog"
      class="dialog cmdk"
      role="dialog"
      aria-modal="true"
      :aria-label="t('paletteLabel')"
      @keydown="onDialogKey"
    >
      <div class="cmdk__input-row">
        <input
          ref="input"
          v-model="query"
          class="cmdk__input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          :aria-controls="listId"
          :aria-activedescendant="activeId"
          :aria-label="t('paletteLabel')"
          :placeholder="t('palettePlaceholder')"
        >
      </div>
      <ul
        :id="listId"
        class="cmdk__list"
        role="listbox"
        tabindex="-1"
      >
        <li
          v-for="(tool, index) in results"
          :id="`palette-option-${tool.slug}`"
          :key="tool.slug"
          class="cmdk__opt"
          role="option"
          tabindex="-1"
          :aria-selected="index === active"
          @click="go(index)"
        >
          <span>{{ tool.title }}</span>
          <span class="cmdk__kind">{{ categoryLabel(tool.category) }}</span>
        </li>
      </ul>
      <p
        v-if="results.length === 0"
        class="cmdk__empty"
      >
        {{ t('paletteEmpty') }}
      </p>
      <div class="cmdk__foot">
        <button
          class="btn btn--ghost"
          type="button"
          @click="close"
        >
          {{ t('paletteClose') }}
        </button>
      </div>
    </div>
  </div>
</template>
