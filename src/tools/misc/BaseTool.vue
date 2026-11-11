<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { convertBase, isNumberBase, numberBases, type NumberBase } from '../../lib/misc/base'

const input = ref('255')
const from = ref<NumberBase>(10)
const to = ref<NumberBase>(16)

const result = computed(() => convertBase(input.value, from.value, to.value))
const output = computed(() => (result.value.ok ? result.value.value : ''))
const error = computed(() => (result.value.ok ? '' : result.value.error))

function onBase(event: Event, target: 'from' | 'to') {
  const value = Number((event.target as HTMLSelectElement).value)
  if (!isNumberBase(value)) return
  if (target === 'from') from.value = value
  else to.value = value
}
</script>

<template>
  <div class="stack">
    <label>
      Liczba
      <input
        v-model="input"
        class="input mono"
        inputmode="text"
        spellcheck="false"
      >
    </label>
    <div class="row">
      <label>
        Z systemu
        <select
          class="input"
          :value="from"
          @change="onBase($event, 'from')"
        >
          <option
            v-for="base in numberBases"
            :key="base"
            :value="base"
          >
            {{ base }}
          </option>
        </select>
      </label>
      <label>
        Na system
        <select
          class="input"
          :value="to"
          @change="onBase($event, 'to')"
        >
          <option
            v-for="base in numberBases"
            :key="base"
            :value="base"
          >
            {{ base }}
          </option>
        </select>
      </label>
    </div>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Wynik
      <input
        class="input mono"
        readonly
        :value="output"
      >
    </label>
    <CopyButton :text="output" />
  </div>
</template>
