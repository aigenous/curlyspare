<script setup lang="ts">
import type { StructureTable } from '../../registry/tool-structure'

defineProps<{ table: StructureTable }>()
</script>

<template>
  <div
    class="table-wrap responsive-table"
    tabindex="0"
    role="region"
    :aria-label="table.caption"
  >
    <table class="table">
      <caption class="sr-only">
        {{ table.caption }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="column in table.columns"
            :key="column.key"
            scope="col"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in table.rows"
          :key="rowIndex"
        >
          <template
            v-for="(column, columnIndex) in table.columns"
            :key="column.key"
          >
            <th
              v-if="columnIndex === 0"
              scope="row"
              :class="{ mono: column.mono }"
              :data-label="column.label"
            >
              {{ row.cells[column.key] }}
            </th>
            <td
              v-else
              :class="{ mono: column.mono }"
              :data-label="column.label"
            >
              {{ row.cells[column.key] }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
