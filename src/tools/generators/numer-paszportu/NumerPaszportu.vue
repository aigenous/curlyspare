<script setup lang="ts">
import { formatPaszport, generatePaszporty, validatePaszport } from '../../../lib/generators'
import IdNumberTool from '../IdNumberTool.vue'
</script>

<template>
  <IdNumberTool
    slug="numer-paszportu"
    probe-label="Numer paszportu"
    :generate-many="generatePaszporty"
    :format="formatPaszport"
    :validate="validatePaszport"
  />
</template>
