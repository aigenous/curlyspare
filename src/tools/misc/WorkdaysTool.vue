<script setup lang="ts">
import { computed, ref } from 'vue'
import { addWorkingDays, polishHolidays, workingDaysBetween } from '../../lib/misc/workdays'

const from = ref('2026-11-09')
const to = ref('2026-11-13')
const extra = ref(5)
const between = computed(() => workingDaysBetween(from.value, to.value))
const added = computed(() => addWorkingDays(from.value, extra.value))
const year = computed(() => Number(from.value.slice(0, 4)) || 2026)
const holidays = computed(() => polishHolidays(year.value))
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Data początkowa
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
      v-if="!between.ok"
      class="message-error"
      role="alert"
    >
      {{ between.error }}
    </p>
    <dl
      v-else
      class="stats"
    >
      <div>
        <dt>Dni robocze między datami</dt>
        <dd>{{ between.days }}</dd>
      </div>
    </dl>
    <p
      v-if="between.ok && between.holidays.length"
      class="hint"
    >
      Święta w tym zakresie: {{ between.holidays.map((holiday) => `${holiday.date} ${holiday.name}`).join('; ') }}.
    </p>
    <p class="hint">
      Liczone są dni robocze po dacie początkowej, do końcowej włącznie. Weekendy i święta ustawowe nie wchodzą.
    </p>
    <label>
      Dodaj dni robocze do daty początkowej
      <input
        v-model.number="extra"
        class="input"
        type="number"
        step="1"
      >
    </label>
    <p
      v-if="!added.ok"
      class="message-error"
      role="alert"
    >
      {{ added.error }}
    </p>
    <p v-else>
      Wypada: <strong>{{ added.date }}</strong>
    </p>
    <h2>Święta w {{ year }}</h2>
    <ul class="match-list">
      <li
        v-for="holiday in holidays"
        :key="holiday.date + holiday.name"
      >
        {{ holiday.date }} — {{ holiday.name }}
      </li>
    </ul>
  </div>
</template>
