<script setup lang="ts">
import type { AnatomyStep } from '../tools/anatomy/types'
import '../styles/anatomy.css'

defineProps<{
  steps: readonly AnatomyStep[]
  copy: {
    match: string
    mismatch: string
  }
}>()

function showsComplement(step: AnatomyStep): boolean {
  switch (step.formula) {
    case 'mod10-complement':
      return true
    default: {
      const unexpected: never = step.formula
      return unexpected
    }
  }
}
</script>

<template>
  <div
    v-for="(step, stepIndex) in steps"
    :key="stepIndex"
    class="anatomy__calc"
  >
    <p>
      <template
        v-for="(term, termIndex) in step.terms"
        :key="termIndex"
      >
        <template v-if="termIndex > 0">
          +
        </template>
        <i>{{ term.weight }}·</i><b>{{ term.value }}</b>
      </template>
      = <b>{{ step.sum }}</b>
    </p>
    <p v-if="showsComplement(step)">
      ({{ step.modulus }} − {{ step.sum }} mod {{ step.modulus }}) mod {{ step.modulus }} =
      <b>{{ step.expected }}</b>
      <template v-if="step.matches === true">
        {{ copy.match }}
      </template>
      <template v-else-if="step.matches === false">
        {{ copy.mismatch }}
      </template>
    </p>
  </div>
</template>
