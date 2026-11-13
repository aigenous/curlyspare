<script setup lang="ts">
import { ref } from 'vue'
import { decodeJwt, JWT_NOTICE, type DecodedJwt, type JwtDate } from '../../../lib/converters/jwt'
import CopyButton from '../../../components/CopyButton.vue'

const token = ref('')
const error = ref('')
const decoded = ref<DecodedJwt | null>(null)

function claim(date: JwtDate | null): string {
  if (!date) return 'brak'
  return `${date.warsaw} (UTC ${date.isoUtc}, unix ${date.unix})`
}

function run(): void {
  const result = decodeJwt(token.value)
  if (!result.ok) {
    decoded.value = null
    error.value = result.error
    return
  }
  error.value = ''
  decoded.value = result.value
}
</script>

<template>
  <div class="cv">
    <p class="cv-note">
      {{ JWT_NOTICE }}
    </p>
    <label class="cv-field">
      Token JWT
      <textarea
        v-model="token"
        class="input cv-area"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        placeholder="wklej token"
        @keydown.ctrl.enter.prevent="run"
        @keydown.meta.enter.prevent="run"
      />
    </label>
    <div class="cv-actions">
      <button
        class="button"
        type="button"
        @click="run"
      >
        Dekoduj
      </button>
    </div>
    <p
      v-if="error"
      class="cv-message cv-error"
      role="alert"
    >
      {{ error }}
    </p>
    <template v-if="decoded">
      <dl class="cv-meta">
        <div>
          <dt>Algorytm</dt>
          <dd>{{ decoded.algorithm ?? 'brak' }}</dd>
        </div>
        <div>
          <dt>Typ</dt>
          <dd>{{ decoded.type ?? 'brak' }}</dd>
        </div>
        <div>
          <dt>Wygasa (exp)</dt>
          <dd>{{ claim(decoded.exp) }}</dd>
        </div>
        <div>
          <dt>Wystawiono (iat)</dt>
          <dd>{{ claim(decoded.iat) }}</dd>
        </div>
        <div>
          <dt>Nie wcześniej niż (nbf)</dt>
          <dd>{{ claim(decoded.nbf) }}</dd>
        </div>
        <div>
          <dt>Ważność</dt>
          <dd>
            {{
              decoded.expired === true
                ? 'wygasł według zegara przeglądarki'
                : decoded.notYetValid === true
                  ? 'jeszcze nieważny według zegara przeglądarki'
                  : 'brak przeszkody w datach exp i nbf'
            }}
          </dd>
        </div>
        <div>
          <dt id="jwt-podpis">Podpis</dt>
          <dd aria-labelledby="jwt-podpis">
            nie zweryfikowano{{ decoded.signature ? `: ${decoded.signature}` : '' }}
          </dd>
        </div>
      </dl>
      <h2 id="jwt-naglowek">
        Nagłówek
      </h2>
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        aria-labelledby="jwt-naglowek"
        :value="decoded.headerText"
      />
      <div class="cv-actions">
        <CopyButton :text="decoded.headerText" />
      </div>
      <h2 id="jwt-payload">
        Payload
      </h2>
      <textarea
        class="input cv-area cv-output"
        readonly
        spellcheck="false"
        aria-labelledby="jwt-payload"
        :value="decoded.payloadText"
      />
      <div class="cv-actions">
        <CopyButton :text="decoded.payloadText" />
      </div>
    </template>
  </div>
</template>

<style
  scoped
  src="../tool.css"
></style>
