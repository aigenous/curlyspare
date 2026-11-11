<script setup lang="ts">
import { computed, ref } from 'vue'
import { convertData, dataUnits, isDataUnit, type DataUnit } from '../../lib/misc/units'

const amount = ref('1,5')
const unit = ref<DataUnit>('KiB')
const result = computed(() => convertData(amount.value, unit.value))

function onUnit(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isDataUnit(value)) unit.value = value
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Wartość
        <input
          v-model="amount"
          class="input mono"
          inputmode="decimal"
          spellcheck="false"
        >
      </label>
      <label>
        Jednostka
        <select
          class="input"
          :value="unit"
          @change="onUnit"
        >
          <option
            v-for="item in dataUnits"
            :key="item.id"
            :value="item.id"
          >
            {{ item.id }}
          </option>
        </select>
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
      <div
        v-for="item in result.values"
        :key="item.id"
      >
        <dt>{{ item.id }}</dt>
        <dd>{{ item.text }}</dd>
      </div>
    </dl>
    <p class="hint">
      KB to 1000 bajtów, KiB to 1024 bajty. Ułamek jest zaokrąglany do pełnego bajta.
    </p>
  </div>
</template>
