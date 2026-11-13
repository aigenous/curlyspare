<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { message, visible } = useToast()
</script>

<template>
  <div
    v-if="visible"
    class="toast"
    role="status"
  >
    {{ message }}
  </div>
</template>
