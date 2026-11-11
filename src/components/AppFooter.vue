<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { brand } from '../brand'
import { t } from '../i18n'
</script>

<template>
  <footer class="footer">
    <p>{{ t('footerLocal') }}</p>
    <nav aria-label="Informacje prawne">
      <RouterLink to="/regulamin">{{ t('footerTerms') }}</RouterLink>
      <RouterLink to="/polityka-prywatnosci">{{ t('footerPrivacy') }}</RouterLink>
      <RouterLink to="/operator">{{ t('footerOperator') }}</RouterLink>
    </nav>
    <p>
      {{ brand.name }} — {{ t('footerWorking') }}
      {{ brand.operator.name }}, {{ brand.operator.legalForm }}, NIP {{ brand.operator.nip }}
    </p>
  </footer>
</template>
