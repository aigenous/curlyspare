<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { highlightSpans, matchRegex, regexFlags, type RegexFlag } from '../../lib/misc/regex'

const pattern = ref('(?<słowo>\\p{L}+)')
const text = ref('Zażółć gęślą jaźń')
const flags = reactive<Record<RegexFlag, boolean>>({
  d: false,
  g: true,
  i: false,
  m: false,
  s: false,
  u: true,
  v: false,
  y: false,
})

const selected = computed(() => regexFlags.filter((flag) => flags[flag]))
const result = computed(() => matchRegex(pattern.value, selected.value, text.value))
const matches = computed(() => (result.value.ok ? result.value.matches : []))
const spans = computed(() => highlightSpans(text.value, matches.value))
const error = computed(() => (result.value.ok ? '' : result.value.error))
</script>

<template>
  <div class="stack">
    <label>
      Wyrażenie
      <input
        v-model="pattern"
        class="input mono"
        spellcheck="false"
      >
    </label>
    <fieldset class="checks">
      <legend>Flagi</legend>
      <label
        v-for="flag in regexFlags"
        :key="flag"
      >
        <input
          v-model="flags[flag]"
          type="checkbox"
        >
        {{ flag }}
      </label>
    </fieldset>
    <label>
      Tekst
      <textarea
        v-model="text"
        class="input"
        rows="6"
        spellcheck="false"
      />
    </label>
    <p
      v-if="error"
      class="message-error"
      role="alert"
    >
      {{ error }}
    </p>
    <div
      v-else
      class="preview"
    >
      <span
        v-for="(span, index) in spans"
        :key="index"
        :class="{ mark: span.match }"
      >{{ span.text }}</span>
    </div>
    <p
      v-if="!error && matches.length === 0"
      class="hint"
    >
      Brak dopasowań.
    </p>
    <ol
      v-if="matches.length > 0"
      class="match-list"
    >
      <li
        v-for="(match, index) in matches"
        :key="`${match.index}-${index}`"
      >
        <code>{{ match.text }}</code>
        <span class="hint">od pozycji {{ match.index }}</span>
        <ul v-if="match.groups.length > 0">
          <li
            v-for="group in match.groups"
            :key="group.key"
          >
            {{ group.key }}: {{ group.value ?? 'brak' }}
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>
