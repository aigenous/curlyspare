<script setup lang="ts">
import { RouterLink } from 'vue-router'
import LogoMark from './LogoMark.vue'
import { brand } from '../brand'
import { t } from '../i18n'

const operatorLine = `${brand.operator.name}, ${brand.operator.legalForm}, NIP ${brand.operator.nip}`
</script>

<template>
  <footer class="site-footer">
    <div class="wrap">
      <div class="site-footer__cols">
        <div class="site-footer__about stack">
          <RouterLink
            class="logo"
            to="/"
            :aria-label="`${brand.name}, strona główna`"
          >
            <LogoMark />
            <span>{{ brand.name }}</span>
          </RouterLink>
          <p>
            Darmowe narzędzia dla programistów, testerów i analityków. Tworzy je aigenous:
            przedsięwzięcie oparte w 100% na AI, prowadzone w ramach jednoosobowej działalności
            gospodarczej Piotra Szewczyka.
          </p>
        </div>
        <nav aria-label="Narzędzia w stopce">
          <h2>Narzędzia</h2>
          <ul class="foot-links">
            <li>
              <RouterLink to="/generator-pesel">PESEL</RouterLink>
            </li>
            <li>
              <RouterLink to="/generator-nip">NIP</RouterLink>
            </li>
            <li>
              <RouterLink to="/walidator-iban">IBAN</RouterLink>
            </li>
            <li>
              <RouterLink to="/formatowanie-json">JSON</RouterLink>
            </li>
            <li>
              <RouterLink to="/#narzedzia">Wszystkie narzędzia</RouterLink>
            </li>
          </ul>
        </nav>
        <nav aria-label="Informacje prawne">
          <h2>Informacje</h2>
          <ul class="foot-links">
            <li>
              <RouterLink to="/regulamin">{{ t('footerTerms') }}</RouterLink>
            </li>
            <li>
              <RouterLink to="/polityka-prywatnosci">{{ t('footerPrivacy') }}</RouterLink>
            </li>
            <li>
              <RouterLink to="/licencje">Licencje</RouterLink>
            </li>
            <li>
              <RouterLink to="/operator">{{ t('footerOperator') }}</RouterLink>
            </li>
          </ul>
        </nav>
      </div>
      <p class="site-footer__legal">
        {{ t('footerLocal') }}
        {{ operatorLine }}
      </p>
    </div>
  </footer>
</template>
