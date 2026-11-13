<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <div
    class="alert alert--warn tool-notice disclaimer"
    role="note"
    aria-label="Zastrzeżenie"
  >
    <svg
      class="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="m10.3 4.3-7.7 13.7a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
    <p class="small">
      {{ text }}
    </p>
  </div>
</template>
