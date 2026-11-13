<script setup lang="ts">
import {
  formatDowodOsobisty,
  generateDowodyOsobiste,
  validateDowodOsobisty,
} from '../../../lib/generators'
import IdNumberTool from '../IdNumberTool.vue'
</script>

<template>
  <IdNumberTool
    slug="numer-dowodu-osobistego"
    probe-label="Seria i numer"
    :generate-many="generateDowodyOsobiste"
    :format="formatDowodOsobisty"
    :validate="validateDowodOsobisty"
  />
</template>
