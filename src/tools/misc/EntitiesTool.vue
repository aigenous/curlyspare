<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { convertEntities, entityModes, isEntityMode, type EntityMode } from '../../lib/misc/entities'

const input = ref('<p>Zażółć & jaźń</p>')
const mode = ref<EntityMode>('encode')
const output = computed(() => convertEntities(input.value, mode.value))

const modeLabel: Record<EntityMode, string> = {
  encode: 'Koduj',
  decode: 'Dekoduj',
}

function onMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isEntityMode(value)) mode.value = value
}
</script>

<template>
  <div class="stack">
    <label>
      Tekst
      <textarea
        v-model="input"
        class="input mono"
        rows="6"
        spellcheck="false"
      />
    </label>
    <label>
      Kierunek
      <select
        class="input"
        :value="mode"
        @change="onMode"
      >
        <option
          v-for="item in entityModes"
          :key="item"
          :value="item"
        >
          {{ modeLabel[item] }}
        </option>
      </select>
    </label>
    <label>
      Wynik
      <textarea
        class="input mono"
        rows="6"
        readonly
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
