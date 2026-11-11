<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { IdDocumentPage } from './id-document-copy'

defineProps<{
  page: IdDocumentPage
}>()
</script>

<template>
  <div class="guide">
    <p>{{ page.intro }}</p>
    <section>
      <h2>Jak użyć</h2>
      <ol>
        <li
          v-for="step in page.steps"
          :key="step"
        >
          {{ step }}
        </li>
      </ol>
    </section>
    <section>
      <h2>Przykłady</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">
              Wejście
            </th>
            <th scope="col">
              Wynik
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="example in page.examples"
            :key="example.input"
          >
            <td class="mono">
              {{ example.input }}
            </td>
            <td>{{ example.output }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section>
      <div
        v-for="item in page.faq"
        :key="item.question"
      >
        <details>
          <summary>{{ item.question }}</summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </section>
    <section>
      <h2>Powiązane narzędzia</h2>
      <ul>
        <li
          v-for="link in page.related"
          :key="link.href"
        >
          <RouterLink :to="link.href">
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </section>
    <p class="crumbs">
      <RouterLink to="/">
        {{ page.breadcrumb[0] }}
      </RouterLink>
      › {{ page.breadcrumb[1] }} › {{ page.breadcrumb[2] }}
    </p>
  </div>
</template>

<style scoped>
.guide {
  display: grid;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.guide h2 {
  margin: 0 0 0.5rem;
}

.guide ol,
.guide ul {
  margin: 0;
  padding-left: 1.2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid var(--line);
  padding: 0.45rem 0.65rem;
  text-align: left;
}

details {
  border-top: 1px solid var(--line);
  padding: 0.55rem 0;
}

summary {
  cursor: pointer;
  font-weight: 700;
}

.crumbs {
  margin: 0;
  color: var(--ink-muted);
}
</style>
