<script setup lang="ts">
import { computed, ref } from 'vue'
import CopyButton from '../../components/CopyButton.vue'
import {
  cryptoRandomInt,
  entropyBits,
  entropyLevel,
  generatePassword,
  passwordAlphabet,
  passwordMaxLength,
  passwordMinLength,
  type PasswordClasses,
} from '../../lib/misc/password'

const length = ref(16)
const classes = ref<PasswordClasses>({ lower: true, upper: true, digits: true, symbols: false })
const password = ref('')
const error = ref('')

const bits = computed(() => entropyBits(length.value, passwordAlphabet(classes.value).length))
const level = computed(() => entropyLevel(bits.value))

const levelLabel: Record<typeof level.value, string> = {
  niska: 'niska',
  umiarkowana: 'umiarkowana',
  wysoka: 'wysoka',
}

function generate() {
  const result = generatePassword(length.value, classes.value, cryptoRandomInt)
  if (!result.ok) {
    password.value = ''
    error.value =
      result.reason === 'classes'
        ? 'Zaznacz co najmniej jeden zestaw znaków.'
        : `Długość musi mieć od ${passwordMinLength} do ${passwordMaxLength} znaków i wystarczyć na każdy zaznaczony zestaw.`
    return
  }
  error.value = ''
  password.value = result.password
}
</script>

<template>
  <div class="stack">
    <label>
      Długość ({{ passwordMinLength }}–{{ passwordMaxLength }})
      <input
        v-model.number="length"
        class="input"
        type="number"
        :min="passwordMinLength"
        :max="passwordMaxLength"
        step="1"
      >
    </label>
    <fieldset class="checks">
      <legend>Zestawy znaków</legend>
      <label><input
        v-model="classes.lower"
        type="checkbox"
      > Małe litery</label>
      <label><input
        v-model="classes.upper"
        type="checkbox"
      > Wielkie litery</label>
      <label><input
        v-model="classes.digits"
        type="checkbox"
      > Cyfry</label>
      <label><input
        v-model="classes.symbols"
        type="checkbox"
      > Znaki specjalne</label>
    </fieldset>
    <p class="hint">
      Szacunek entropii: {{ bits }} bitów ({{ levelLabel[level] }}). Losowanie używa crypto.getRandomValues i zostaje w przeglądarce.
    </p>
    <button
      class="button"
      type="button"
      @click="generate"
    >
      Generuj
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Hasło
      <input
        class="input mono"
        readonly
        :value="password"
      >
    </label>
    <CopyButton :text="password" />
  </div>
</template>
