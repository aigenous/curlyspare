<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { demoHint } from '../../lib/landing/copy'
import {
  PESEL_EXAMPLE,
  PESEL_LENGTH,
  previewPesel,
  type PeselPreviewCalc,
} from '../../lib/landing/pesel-preview'

const value = ref(PESEL_EXAMPLE)
const preview = computed(() => previewPesel(value.value))
const match = computed(() => (preview.value.calc.mode === 'match' ? preview.value.calc : null))
const mismatch = computed(() => (preview.value.calc.mode === 'mismatch' ? preview.value.calc : null))
const pending = computed(() => (preview.value.calc.mode === 'pending' ? preview.value.calc.message : ''))

function onInput(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const clean = target.value.replace(/\D/g, '').slice(0, PESEL_LENGTH)
  if (target.value !== clean) target.value = clean
  value.value = clean
}

function termKey(calc: PeselPreviewCalc, index: number): string {
  if (calc.mode === 'pending') return String(index)
  return `${calc.terms[index]?.weight ?? 0}-${index}`
}
</script>

<template>
  <section
    class="card card--ink stack"
    aria-labelledby="demo-h"
  >
    <div class="row row--between">
      <h2
        id="demo-h"
        class="h3"
      >
        Wypróbuj: walidator PESEL
      </h2>
      <RouterLink to="/generator-pesel">
        Pełne narzędzie
      </RouterLink>
    </div>
    <div class="field">
      <label
        class="field__label"
        for="demo-pesel"
      >Numer PESEL</label>
      <input
        id="demo-pesel"
        class="input input--mono"
        :value="value"
        inputmode="numeric"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="demo-pesel-hint"
        :aria-invalid="preview.tone === 'error'"
        @input="onInput"
      >
      <p
        id="demo-pesel-hint"
        class="field__hint"
      >
        {{ demoHint }}
      </p>
    </div>
    <p
      class="status"
      :class="`status--${preview.tone}`"
      role="status"
    >
      <svg
        v-if="preview.tone === 'ok'"
        class="icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
      <svg
        v-else-if="preview.tone === 'error'"
        class="icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
      <span>
        {{ preview.headline }}
        <span
          v-if="preview.note"
          class="status__note"
        >{{ preview.note }}</span>
      </span>
    </p>
    <div
      class="anatomy"
      aria-hidden="true"
    >
      <div
        v-for="part in preview.parts"
        :key="part.label"
        class="anatomy__part"
        :style="{ '--n': part.cells.length }"
      >
        <div class="cells">
          <span
            v-for="(cell, index) in part.cells"
            :key="`${part.label}-${index}`"
            class="cell"
            :class="cell.state === 'filled' ? undefined : `cell--${cell.state}`"
          >{{ cell.text }}</span>
        </div>
        <span class="brace">
          <i /><i /><i /><i />
        </span>
        <span class="anatomy__label">{{ part.label }}</span>
      </div>
    </div>
    <dl
      v-if="preview.facts.length > 0"
      class="facts"
    >
      <template
        v-for="fact in preview.facts"
        :key="fact.term"
      >
        <dt>{{ fact.term }}</dt>
        <dd>{{ fact.detail }}</dd>
      </template>
    </dl>
    <p class="calc">
      <template v-if="pending">
        {{ pending }}
      </template>
      <template v-else-if="match">
        <span
          v-for="(term, index) in match.terms"
          :key="termKey(match, index)"
        >
          <template v-if="index > 0">
            {{ ' + ' }}
          </template>
          <i>{{ term.weight }}·</i><b>{{ term.digit }}</b>
        </span>
        {{ ' = ' }}<b>{{ match.sum }}</b>
        <br>
        (10 − {{ match.sum }} mod 10) mod 10 = <b>{{ match.digit }}</b> ✓ zgadza się z 11. cyfrą
      </template>
      <template v-else-if="mismatch">
        <span
          v-for="(term, index) in mismatch.terms"
          :key="termKey(mismatch, index)"
        >
          <template v-if="index > 0">
            {{ ' + ' }}
          </template>
          <i>{{ term.weight }}·</i><b>{{ term.digit }}</b>
        </span>
        {{ ' = ' }}<b>{{ mismatch.sum }}</b>
        <br>
        {{ mismatch.message }}
        <span class="calc__caveat">{{ mismatch.caveat }}</span>
      </template>
    </p>
  </section>
</template>
