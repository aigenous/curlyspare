<script setup lang="ts">
import { computed, ref } from 'vue'
import { dateSpan } from '../../lib/misc/dates'

const from = ref('1990-05-15')
const to = ref('2026-11-11')
const result = computed(() => dateSpan(from.value, to.value))
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Data początkowa albo urodzenia
        <input
          v-model="from"
          class="input"
          type="date"
        >
      </label>
      <label>
        Data końcowa
        <input
          v-model="to"
          class="input"
          type="date"
        >
      </label>
    </div>
    <p
      v-if="!result.ok"
      class="message-error"
    >
      {{ result.error }}
    </p>
    <template v-else>
      <p>{{ result.span.words }}</p>
      <dl class="stats">
        <div>
          <dt>Lata</dt>
          <dd>{{ result.span.years }}</dd>
        </div>
        <div>
          <dt>Miesiące</dt>
          <dd>{{ result.span.months }}</dd>
        </div>
        <div>
          <dt>Dni</dt>
          <dd>{{ result.span.days }}</dd>
        </div>
        <div>
          <dt>Dni łącznie</dt>
          <dd>{{ result.span.totalDays }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>
