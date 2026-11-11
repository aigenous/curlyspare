<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  calculateVat,
  isVatBasis,
  isVatRate,
  vatBases,
  vatRates,
  type VatBasis,
  type VatRate,
} from '../../lib/misc/vat'

const input = ref('100,00')
const rate = ref<VatRate>(23)
const basis = ref<VatBasis>('net')
const result = computed(() => calculateVat(input.value, rate.value, basis.value))

const basisLabel: Record<VatBasis, string> = {
  net: 'Kwota netto',
  gross: 'Kwota brutto',
}

function onRate(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  if (isVatRate(value)) rate.value = value
}

function onBasis(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isVatBasis(value)) basis.value = value
}
</script>

<template>
  <div class="stack">
    <div class="row">
      <label>
        Kwota
        <input
          v-model="input"
          class="input mono"
          inputmode="decimal"
          spellcheck="false"
        >
      </label>
      <label>
        Stawka
        <select
          class="input"
          :value="rate"
          @change="onRate"
        >
          <option
            v-for="item in vatRates"
            :key="item"
            :value="item"
          >
            {{ item }}%
          </option>
        </select>
      </label>
      <label>
        Podana kwota to
        <select
          class="input"
          :value="basis"
          @change="onBasis"
        >
          <option
            v-for="item in vatBases"
            :key="item"
            :value="item"
          >
            {{ basisLabel[item] }}
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
      <div>
        <dt>Netto</dt>
        <dd>{{ result.breakdown.net }}</dd>
      </div>
      <div>
        <dt>VAT</dt>
        <dd>{{ result.breakdown.vat }}</dd>
      </div>
      <div>
        <dt>Brutto</dt>
        <dd>{{ result.breakdown.gross }}</dd>
      </div>
    </dl>
  </div>
</template>
