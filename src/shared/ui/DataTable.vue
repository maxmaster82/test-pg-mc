<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { useIsMobile, useIsWide } from '@/shared/composables/breakpoints'
import AppIcon from './AppIcon.vue'
import type { SortOrder } from '@/shared/api/types'
import type { DataColumn, SortState } from './data-table'

const { columns, rows, rowKey, caption, sort, busy } = defineProps<{
  columns: DataColumn[]
  rows: T[]
  rowKey: (row: T) => string
  /** Accessible name of the table (visually hidden). */
  caption: string
  sort?: SortState
  /** Refetching in the background: rows stay visible but are marked busy. */
  busy?: boolean
}>()

const emit = defineEmits<{
  /** Header click (toggle, order omitted) or explicit choice from the mobile sort menu. */
  sort: [field: string, order?: SortOrder]
}>()

defineSlots<{
  [cell: `cell-${string}`]: (props: { row: T }) => unknown
  actions?: (props: { row: T }) => unknown
  /** Optional selection control rendered before the first cell/card title. */
  select?: (props: { row: T }) => unknown
  selectAll?: () => unknown
}>()

const isMobile = useIsMobile()
const isWide = useIsWide()

const visibleColumns = computed(() =>
  isWide.value ? columns : columns.filter((c) => c.priority !== 'low'),
)
const [titleColumn, ...detailColumns] = columns

function ariaSort(column: DataColumn) {
  if (!column.sortable || sort?.field !== column.key) return undefined
  return sort.order === 'asc' ? 'ascending' : 'descending'
}

const sortOptions = computed(() =>
  columns
    .filter((c) => c.sortable)
    .flatMap((c) => [
      { value: `${c.key}:asc`, label: `${c.label} (ascending)` },
      { value: `${c.key}:desc`, label: `${c.label} (descending)` },
    ]),
)
const sortValue = computed(() => (sort ? `${sort.field}:${sort.order}` : ''))

function onMobileSort(event: Event) {
  const [field = '', order] = (event.target as HTMLSelectElement).value.split(':')
  emit('sort', field, order === 'desc' ? 'desc' : 'asc')
}
</script>

<template>
  <!-- Mobile: cards with the same data and actions (ADR 0004). -->
  <div v-if="isMobile" :aria-busy="busy || undefined" :class="{ 'opacity-60': busy }">
    <div class="flex items-center gap-2 border-b border-line px-4 py-3">
      <slot name="selectAll" />
      <label class="ml-auto flex items-center gap-2 text-sm text-muted">
        Sort by
        <select
          :value="sortValue"
          class="min-h-11 rounded-(--radius-control) border border-line-strong bg-surface px-2 text-sm text-fg"
          @change="onMobileSort"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
    <ul :aria-label="caption" class="divide-y divide-line">
      <li v-for="row in rows" :key="rowKey(row)" class="flex gap-3 px-4 py-4">
        <slot name="select" :row="row" />
        <div class="min-w-0 flex-1">
          <div v-if="titleColumn" class="font-medium break-words">
            <slot :name="`cell-${titleColumn.key}`" :row="row" />
          </div>
          <dl class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <template v-for="column in detailColumns" :key="column.key">
              <dt class="text-muted">{{ column.label }}</dt>
              <dd class="min-w-0 break-words"><slot :name="`cell-${column.key}`" :row="row" /></dd>
            </template>
          </dl>
        </div>
        <div v-if="$slots.actions" class="shrink-0"><slot name="actions" :row="row" /></div>
      </li>
    </ul>
  </div>

  <!-- Tablet/desktop: semantic table; low-priority columns hidden below 1280px (sidebar + table must fit). -->
  <div v-else class="overflow-x-auto">
    <table
      class="w-full text-left text-sm"
      :aria-busy="busy || undefined"
      :class="{ 'opacity-60': busy }"
    >
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead class="border-b border-line text-xs font-semibold text-muted uppercase">
        <tr>
          <th v-if="$slots.selectAll" scope="col" class="w-12 px-4 py-3">
            <slot name="selectAll" />
          </th>
          <th
            v-for="column in visibleColumns"
            :key="column.key"
            scope="col"
            :aria-sort="ariaSort(column)"
            :class="['px-4 py-3 whitespace-nowrap', column.align === 'end' && 'text-right']"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="-mx-1 inline-flex items-center gap-1 rounded px-1 py-1 uppercase hover:text-fg"
              @click="emit('sort', column.key)"
            >
              {{ column.label }}
              <AppIcon
                :name="
                  sort?.field === column.key
                    ? sort.order === 'asc'
                      ? 'arrowUp'
                      : 'arrowDown'
                    : 'sort'
                "
                :size="14"
                :class="sort?.field === column.key ? 'text-primary' : 'opacity-50'"
              />
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
          <th v-if="$slots.actions" scope="col" class="w-16 px-4 py-3">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="row in rows" :key="rowKey(row)" class="hover:bg-surface-muted/60">
          <td v-if="$slots.select" class="px-4 py-3"><slot name="select" :row="row" /></td>
          <td
            v-for="column in visibleColumns"
            :key="column.key"
            :class="['px-4 py-3', column.align === 'end' && 'text-right tabular-nums']"
          >
            <slot :name="`cell-${column.key}`" :row="row" />
          </td>
          <td v-if="$slots.actions" class="px-4 py-2 text-right">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
