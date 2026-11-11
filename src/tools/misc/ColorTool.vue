<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import { formatHex, hslToRgb, parseHex, rgbToHsl, type Hsl, type Rgb } from '../../lib/misc/color'

const rgb = ref<Rgb>({ r: 49, g: 92, b: 180 })
const hsl = ref<Hsl>(rgbToHsl(rgb.value))
const hex = ref(formatHex(rgb.value))
const error = ref('')

function applyRgb(next: Rgb) {
  rgb.value = next
  hsl.value = rgbToHsl(next)
  hex.value = formatHex(next)
  error.value = ''
}

function onHex(event: Event) {
  const value = (event.target as HTMLInputElement).value
  hex.value = value
  const parsed = parseHex(value)
  if (!parsed) {
    error.value = 'Podaj kolor HEX, na przykład #315CB4.'
    return
  }
  applyRgb(parsed)
  hex.value = value
}

function onRgb() {
  applyRgb({ ...rgb.value })
}

function onHsl() {
  applyRgb(hslToRgb(hsl.value))
}
</script>

<template>
  <div class="stack">
    <div
      class="swatch"
      role="img"
      :aria-label="`Podgląd koloru ${formatHex(rgb)}`"
      :style="{ background: formatHex(rgb) }"
    />
    <label>
      HEX
      <input
        class="input mono"
        type="text"
        :value="hex"
        @change="onHex"
      >
    </label>
    <p
      v-if="error"
      class="message-error"
      role="alert"
    >
      {{ error }}
    </p>
    <div class="row">
      <label>
        Czerwony
        <input
          v-model.number="rgb.r"
          class="input"
          type="number"
          min="0"
          max="255"
          @change="onRgb"
        >
      </label>
      <label>
        Zielony
        <input
          v-model.number="rgb.g"
          class="input"
          type="number"
          min="0"
          max="255"
          @change="onRgb"
        >
      </label>
      <label>
        Niebieski
        <input
          v-model.number="rgb.b"
          class="input"
          type="number"
          min="0"
          max="255"
          @change="onRgb"
        >
      </label>
    </div>
    <div class="row">
      <label>
        Odcień
        <input
          v-model.number="hsl.h"
          class="input"
          type="number"
          min="0"
          max="360"
          step="0.1"
          @change="onHsl"
        >
      </label>
      <label>
        Nasycenie
        <input
          v-model.number="hsl.s"
          class="input"
          type="number"
          min="0"
          max="100"
          step="0.1"
          @change="onHsl"
        >
      </label>
      <label>
        Jasność
        <input
          v-model.number="hsl.l"
          class="input"
          type="number"
          min="0"
          max="100"
          step="0.1"
          @change="onHsl"
        >
      </label>
    </div>
    <CopyButton :text="formatHex(rgb)" />
  </div>
</template>
