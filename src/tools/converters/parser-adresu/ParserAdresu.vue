<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { buildUrl, encodeParams, parseAddress, type ParsedUrl, type QueryParam } from '../../../lib/converters/url-parts'

const source = ref('')
const error = ref('')
const kind = ref<'url' | 'query' | ''>('')
const parts = ref<ParsedUrl | null>(null)
const params = ref<QueryParam[]>([])
const rebuilt = ref('')

function parse(): void {
  const result = parseAddress(source.value)
  rebuilt.value = ''
  if (!result.ok) {
    kind.value = ''
    parts.value = null
    params.value = []
    error.value = result.error
    return
  }
  error.value = ''
  kind.value = result.value.kind
  parts.value = result.value.url
  params.value = result.value.params.map((param) => ({ ...param }))
}

function addParam(): void {
  params.value.push({ key: '', value: '' })
}

function removeParam(index: number): void {
  params.value.splice(index, 1)
}

function rebuild(): void {
  if (kind.value === 'query' || !parts.value) {
    error.value = ''
    rebuilt.value = encodeParams(params.value)
    return
  }
  const result = buildUrl({ ...parts.value, params: params.value })
  if (!result.ok) {
    rebuilt.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  rebuilt.value = result.value
}
</script>

<template>
  <div class="stack">
    <label>
      Adres URL albo parametry
      <textarea
        v-model="source"
        class="input mono"
        rows="4"
        spellcheck="false"
        autocomplete="off"
        placeholder="https://example.com/szukaj?q=ala"
        @keydown.ctrl.enter.prevent="parse"
        @keydown.meta.enter.prevent="parse"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="parse"
    >
      Rozłóż
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <dl
      v-if="parts"
      class="stats"
    >
      <div>
        <dt>Protokół</dt>
        <dd>{{ parts.protocol }}</dd>
      </div>
      <div>
        <dt>Host</dt>
        <dd>{{ parts.hostname }}</dd>
      </div>
      <div>
        <dt>Port</dt>
        <dd>{{ parts.port || '—' }}</dd>
      </div>
      <div>
        <dt>Ścieżka</dt>
        <dd>{{ parts.pathname }}</dd>
      </div>
      <div>
        <dt>Fragment</dt>
        <dd>{{ parts.hash || '—' }}</dd>
      </div>
    </dl>
    <div
      v-for="(param, index) in params"
      :key="index"
      class="row"
    >
      <label>
        Nazwa
        <input
          v-model="param.key"
          class="input mono"
          type="text"
          spellcheck="false"
        >
      </label>
      <label>
        Wartość
        <input
          v-model="param.value"
          class="input mono"
          type="text"
          spellcheck="false"
        >
      </label>
      <button
        class="button-ghost"
        type="button"
        @click="removeParam(index)"
      >
        Usuń
      </button>
    </div>
    <div
      v-if="kind"
      class="row"
    >
      <button
        class="button-ghost"
        type="button"
        @click="addParam"
      >
        Dodaj parametr
      </button>
      <button
        class="button"
        type="button"
        @click="rebuild"
      >
        Złóż adres
      </button>
    </div>
    <label v-if="rebuilt">
      Wynik
      <input
        class="input mono"
        readonly
        spellcheck="false"
        :value="rebuilt"
      >
    </label>
    <CopyButton
      v-if="rebuilt"
      :text="rebuilt"
    />
  </div>
</template>
