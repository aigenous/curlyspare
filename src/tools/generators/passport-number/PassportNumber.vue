<script setup lang="ts">
import { formatPassport, generatePassports, validatePassport } from '../../../lib/generators'
import IdNumberTool from '../IdNumberTool.vue'
</script>

<template>
  <IdNumberTool
    slug="numer-paszportu"
    probe-label="Numer paszportu"
    :generate-many="generatePassports"
    :format="formatPassport"
    :validate="validatePassport"
  />
</template>
