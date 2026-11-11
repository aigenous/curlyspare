<script setup lang="ts">
import { computed, ref } from 'vue'
import { commonTimeZones, convertTimeZone, isTimeZone } from '../../lib/misc/timezone'

const date = ref('2026-01-15')
const time = ref('12:00')
const fromZone = ref('Europe/Warsaw')
const toZone = ref('America/New_York')
const customFrom = ref('')
const customTo = ref('')
const result = computed(() =>
  convertTimeZone(date.value, time.value, customFrom.value.trim() || fromZone.value, customTo.value.trim() || toZone.value),
)

function onZone(event: Event, target: 'from' | 'to') {
  const value = (event.target as HTMLSelectElement).value
  if (!isTimeZone(value)) return
  if (target === 'from') fromZone.value = value
  else toZone.value = value
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Data
        <input
          v-model="date"
          class="input"
          type="date"
        >
      </label>
      <label>
        Godzina
        <input
          v-model="time"
          class="input"
          type="time"
        >
      </label>
    </div>
    <div class="row">
      <label>
        Strefa źródłowa
        <select
          class="input"
          :value="fromZone"
          @change="onZone($event, 'from')"
        >
          <option
            v-for="zone in commonTimeZones"
            :key="zone"
            :value="zone"
          >
            {{ zone }}
          </option>
        </select>
      </label>
      <label>
        Inna strefa źródłowa
        <input
          v-model="customFrom"
          class="input mono"
          spellcheck="false"
          placeholder="np. Pacific/Auckland"
        >
      </label>
    </div>
    <div class="row">
      <label>
        Strefa docelowa
        <select
          class="input"
          :value="toZone"
          @change="onZone($event, 'to')"
        >
          <option
            v-for="zone in commonTimeZones"
            :key="zone"
            :value="zone"
          >
            {{ zone }}
          </option>
        </select>
      </label>
      <label>
        Inna strefa docelowa
        <input
          v-model="customTo"
          class="input mono"
          spellcheck="false"
          placeholder="np. Asia/Singapore"
        >
      </label>
    </div>
    <p
      v-if="!result.ok"
      class="message-error"
      role="alert"
    >
      {{ result.error }}
    </p>
    <dl
      v-else
      class="stats"
    >
      <div>
        <dt>{{ result.source.zone }}</dt>
        <dd>{{ result.source.date }} {{ result.source.time }}</dd>
      </div>
      <div>
        <dt>{{ result.target.zone }}</dt>
        <dd>{{ result.target.date }} {{ result.target.time }}</dd>
      </div>
      <div>
        <dt>Przesunięcie</dt>
        <dd>{{ result.source.offset }} → {{ result.target.offset }}</dd>
      </div>
    </dl>
    <p
      v-if="result.ok && result.note"
      class="hint"
    >
      {{ result.note }}
    </p>
  </div>
</template>
