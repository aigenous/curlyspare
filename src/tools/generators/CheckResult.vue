<script setup lang="ts">
import { VALID_NUMBER_CAVEAT } from './verdicts'

withDefaults(
  defineProps<{
    message: string
    error: boolean
    detail?: string
  }>(),
  { detail: '' },
)
</script>

<template>
  <div
    v-if="message"
    class="stack"
  >
    <p
      :class="error ? 'message-error' : 'muted'"
      :role="error ? 'alert' : 'status'"
    >
      {{ message }}
    </p>
    <p
      v-if="!error"
      class="muted"
    >
      {{ VALID_NUMBER_CAVEAT }}
    </p>
    <p
      v-if="!error && detail"
      class="muted"
    >
      {{ detail }}
    </p>
  </div>
</template>
