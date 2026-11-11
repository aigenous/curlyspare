<script setup lang="ts">
import { ref } from 'vue'
import CopyButton from '../../../components/CopyButton.vue'
import { formatSql, isSqlDialect, type SqlDialect } from '../../../lib/converters/sql'

const dialect = ref<SqlDialect>('postgresql')
const source = ref('')
const output = ref('')
const error = ref('')

const dialects: { id: SqlDialect; label: string }[] = [
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'transactsql', label: 'Transact-SQL' },
  { id: 'plsql', label: 'PL/SQL' },
  { id: 'sql', label: 'SQL (ogólny)' },
]

function onDialect(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (isSqlDialect(value)) dialect.value = value
}

function run(): void {
  const result = formatSql(source.value, dialect.value)
  if (!result.ok) {
    output.value = ''
    error.value = result.error
    return
  }
  error.value = ''
  output.value = result.value
}
</script>

<template>
  <div class="stack">
    <label>
      Dialekt
      <select
        class="input"
        :value="dialect"
        @change="onDialect"
      >
        <option
          v-for="item in dialects"
          :key="item.id"
          :value="item.id"
        >
          {{ item.label }}
        </option>
      </select>
    </label>
    <label>
      Zapytanie SQL
      <textarea
        v-model="source"
        class="input mono"
        rows="10"
        spellcheck="false"
        autocomplete="off"
        @keydown.ctrl.enter.prevent="run"
        @keydown.meta.enter.prevent="run"
      />
    </label>
    <button
      class="button"
      type="button"
      @click="run"
    >
      Formatuj
    </button>
    <p
      v-if="error"
      class="message-error"
    >
      {{ error }}
    </p>
    <label>
      Wynik
      <textarea
        class="input mono"
        rows="12"
        readonly
        spellcheck="false"
        :value="output"
      />
    </label>
    <CopyButton :text="output" />
  </div>
</template>
