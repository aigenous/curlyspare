<script setup lang="ts">
import { computed, ref } from 'vue'
import { adjustPercent, percentChange, percentOf, ratioPercent } from '../../lib/misc/percent'

const percent = ref('20')
const whole = ref('150')
const part = ref('30')
const from = ref('80')
const to = ref('100')
const base = ref('200')
const delta = ref('10')

const share = computed(() => percentOf(percent.value, whole.value))
const ratio = computed(() => ratioPercent(part.value, whole.value))
const change = computed(() => percentChange(from.value, to.value))
const added = computed(() => adjustPercent(base.value, delta.value, 'add'))
const removed = computed(() => adjustPercent(base.value, delta.value, 'subtract'))
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Procent
        <input
          v-model="percent"
          class="input"
          inputmode="decimal"
        >
      </label>
      <label>
        Z liczby
        <input
          v-model="whole"
          class="input"
          inputmode="decimal"
        >
      </label>
    </div>
    <p v-if="share.ok">
      Wynik: <strong>{{ share.text }}</strong>
    </p>
    <p
      v-else
      class="message-error"
    >
      {{ share.error }}
    </p>
    <div class="row">
      <label>
        Część
        <input
          v-model="part"
          class="input"
          inputmode="decimal"
        >
      </label>
      <label>
        Całość
        <input
          v-model="whole"
          class="input"
          inputmode="decimal"
        >
      </label>
    </div>
    <p v-if="ratio.ok">
      To jest <strong>{{ ratio.text }}%</strong> całości.
    </p>
    <p
      v-else
      class="message-error"
    >
      {{ ratio.error }}
    </p>
    <div class="row">
      <label>
        Było
        <input
          v-model="from"
          class="input"
          inputmode="decimal"
        >
      </label>
      <label>
        Jest
        <input
          v-model="to"
          class="input"
          inputmode="decimal"
        >
      </label>
    </div>
    <p v-if="change.ok">
      Zmiana: <strong>{{ change.text }}%</strong>
    </p>
    <p
      v-else
      class="message-error"
    >
      {{ change.error }}
    </p>
    <div class="row">
      <label>
        Podstawa
        <input
          v-model="base"
          class="input"
          inputmode="decimal"
        >
      </label>
      <label>
        Procent zmiany
        <input
          v-model="delta"
          class="input"
          inputmode="decimal"
        >
      </label>
    </div>
    <dl
      v-if="added.ok && removed.ok"
      class="stats"
    >
      <div>
        <dt>Po dodaniu</dt>
        <dd>{{ added.text }}</dd>
      </div>
      <div>
        <dt>Po odjęciu</dt>
        <dd>{{ removed.text }}</dd>
      </div>
    </dl>
  </div>
</template>
