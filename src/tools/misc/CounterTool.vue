<script setup lang="ts">
import { computed, ref } from 'vue'
import { textStats } from '../../lib/misc/stats'

const input = ref('')
const stats = computed(() => textStats(input.value))
</script>

<template>
  <div class="stack">
    <label>
      Tekst
      <textarea
        v-model="input"
        class="input"
        rows="8"
      />
    </label>
    <dl class="stats">
      <div>
        <dt>Znaki</dt>
        <dd>{{ stats.characters }}</dd>
      </div>
      <div>
        <dt>Znaki bez spacji</dt>
        <dd>{{ stats.charactersNoSpaces }}</dd>
      </div>
      <div>
        <dt>Słowa</dt>
        <dd>{{ stats.words }}</dd>
      </div>
      <div>
        <dt>Linie</dt>
        <dd>{{ stats.lines }}</dd>
      </div>
      <div>
        <dt>Akapity</dt>
        <dd>{{ stats.paragraphs }}</dd>
      </div>
    </dl>
  </div>
</template>
