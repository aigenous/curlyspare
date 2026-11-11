<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { slugifyPolish } from '../../lib/misc/slug'

const input = ref('Zażółć gęślą jaźń — przykładowy tytuł')
const output = computed(() => slugifyPolish(input.value))
</script>

<template>
  <div class="stack">
    <label>
      Tekst
      <input
        v-model="input"
        class="input"
        type="text"
      >
    </label>
    <label>
      Slug
      <input
        class="input mono"
        type="text"
        readonly
        :value="output"
      >
    </label>
    <CopyButton :text="output" />
  </div>
</template>
