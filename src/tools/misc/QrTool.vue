<script setup lang="ts">
import { toDataURL } from 'qrcode'
import { ref } from 'vue'

const input = ref('https://devnarzedzia.example')
const image = ref('')
const error = ref('')

async function generate() {
  error.value = ''
  image.value = ''
  if (!input.value.trim()) {
    error.value = 'Wpisz tekst albo adres.'
    return
  }
  try {
    image.value = await toDataURL(input.value, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: 'M',
    })
  } catch {
    image.value = ''
    error.value = 'Nie udało się wygenerować kodu QR.'
  }
}
</script>

<template>
  <div class="stack">
    <label>
      Treść
      <textarea
        v-model="input"
        class="input"
        rows="4"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="generate"
    >
      Generuj kod QR
    </button>
    <p
      v-if="error"
      class="message-error"
      role="alert"
    >
      {{ error }}
    </p>
    <img
      v-if="image"
      class="qr"
      :src="image"
      alt="Wygenerowany kod QR"
    >
    <a
      v-if="image"
      :href="image"
      download="kod-qr.png"
    >
      Pobierz PNG
    </a>
  </div>
</template>
