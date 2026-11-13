<script setup lang="ts">
import {
  formatIdCardNumber,
  generateIdCardNumbers,
  validateIdCardNumber,
} from '../../../lib/generators'
import IdNumberTool from '../IdNumberTool.vue'
</script>

<template>
  <IdNumberTool
    slug="numer-dowodu-osobistego"
    probe-label="Seria i numer"
    :generate-many="generateIdCardNumbers"
    :format="formatIdCardNumber"
    :validate="validateIdCardNumber"
  />
</template>
