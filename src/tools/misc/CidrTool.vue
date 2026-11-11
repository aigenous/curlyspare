<script setup lang="ts">
import { computed, ref } from 'vue'
import { calculateCidr } from '../../lib/misc/cidr'

const input = ref('192.168.1.10/24')
const result = computed(() => calculateCidr(input.value))

const rows = computed(() => {
  if (!result.value.ok) return []
  const network = result.value.network
  return [
    ['Adres', network.address],
    ['Prefiks', `/${network.prefix}`],
    ['Sieć', network.network],
    ['Rozgłoszenie', network.broadcast],
    ['Maska', network.netmask],
    ['Wildcard', network.wildcard],
    ['Pierwszy host', network.firstHost],
    ['Ostatni host', network.lastHost],
    ['Hosty użyteczne', network.usableHosts],
    ['Adresy łącznie', network.totalAddresses],
  ]
})
</script>

<template>
  <div class="stack">
    <label>
      Adres IPv4 i prefiks
      <input
        v-model="input"
        class="input mono"
        spellcheck="false"
        placeholder="192.168.1.10/24"
      >
    </label>
    <p
      v-if="!result.ok"
      class="message-error"
      role="alert"
    >
      {{ result.error }}
    </p>
    <dl
      v-else
      class="stats"
    >
      <div
        v-for="[label, value] in rows"
        :key="label"
      >
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>
  </div>
</template>
