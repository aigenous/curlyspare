<script setup lang="ts">
import {
  formatDowodOsobisty,
  generateDowodyOsobiste,
  validateDowodOsobisty,
} from '../../../lib/generators'
import IdNumberTool from '../IdNumberTool.vue'

function passText(formatted: string, series: string): string {
  return `Poprawny numer dowodu: ${formatted}. Seria ${series}.`
}
</script>

<template>
  <IdNumberTool
    slug="numer-dowodu-osobistego"
    probe-label="Seria i numer"
    :pass-text="passText"
    :generate-many="generateDowodyOsobiste"
    :format="formatDowodOsobisty"
    :validate="validateDowodOsobisty"
  />
</template>
