<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { arrangeLines, isLineOrder, lineOrders, type LineOrder } from '../../lib/misc/lines'

const input = ref('żółć\nAla\nżółć\n\nala')
const order = ref<LineOrder>('asc')
const unique = ref(true)
const trim = ref(true)
const dropEmpty = ref(true)
const result = computed(() =>
  arrangeLines(input.value, { order: order.value, unique: unique.value, trim: trim.value, dropEmpty: dropEmpty.value }),
)

const orderLabel: Record<LineOrder, string> = {
  none: 'Bez sortowania',
  asc: 'A → Z',
  desc: 'Z → A',
}

function onOrder(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isLineOrder(value)) order.value = value
}
</script>

<template>
  <div class="stack">
    <label>
      Linie
      <textarea
        v-model="input"
        class="input"
        rows="8"
        spellcheck="false"
      />
    </label>
    <label>
      Kolejność
      <select
        class="input"
        :value="order"
        @change="onOrder"
      >
        <option
          v-for="item in lineOrders"
          :key="item"
          :value="item"
        >
          {{ orderLabel[item] }}
        </option>
      </select>
    </label>
    <fieldset class="checks">
      <legend>Opcje</legend>
      <label><input
        v-model="unique"
        type="checkbox"
      > Usuń duplikaty</label>
      <label><input
        v-model="trim"
        type="checkbox"
      > Przytnij końce</label>
      <label><input
        v-model="dropEmpty"
        type="checkbox"
      > Pomiń puste</label>
    </fieldset>
    <p class="hint">
      {{ result.inputCount }} linii na wejściu, {{ result.outputCount }} na wyjściu.
    </p>
    <label>
      Wynik
      <textarea
        class="input"
        rows="8"
        readonly
        :value="result.text"
      />
    </label>
    <CopyButton :text="result.text" />
  </div>
</template>
