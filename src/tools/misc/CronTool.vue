<script setup lang="ts">
import { computed, ref } from 'vue'
import ClientOnly from '../../components/ClientOnly.vue'
import { explainCron } from '../../lib/misc/cron'

const expression = ref('*/15 9-17 * * 1-5')
const result = computed(() => explainCron(expression.value))
</script>

<template>
  <div class="stack">
    <label>
      Wyrażenie cron
      <input
        v-model="expression"
        class="input mono"
        spellcheck="false"
        placeholder="*/15 9-17 * * 1-5"
      >
    </label>
    <p class="hint">
      Pięć pól, czas Europe/Warsaw. Gdy podane są i dzień miesiąca, i dzień tygodnia, wystarczy jedno z nich.
    </p>
    <ClientOnly>
      <p
        v-if="!result.ok"
        class="message-error"
      >
        {{ result.error }}
      </p>
      <template v-else>
        <p>{{ result.summary }}</p>
        <ol class="match-list">
          <li
            v-for="run in result.runs"
            :key="run"
          >
            {{ run }}
          </li>
        </ol>
      </template>
      <template #fallback>
        <p class="hint">
          Kolejne uruchomienia liczone są w przeglądarce, według Europe/Warsaw.
        </p>
      </template>
    </ClientOnly>
  </div>
</template>
