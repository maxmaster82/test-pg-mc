<script setup lang="ts">
import { PAGE_SIZES, type PaginationMeta } from '@/shared/api/types'
import { formatNumber, formatRange } from '@/shared/utils/format'
import AppButton from './AppButton.vue'

const { meta } = defineProps<{ meta: PaginationMeta }>()
const emit = defineEmits<{ page: [page: number]; pageSize: [size: number] }>()
</script>

<template>
  <nav
    aria-label="Pagination"
    class="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-muted" aria-live="polite">
      {{ formatRange(meta.page, meta.pageSize, meta.total) }}
    </p>
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-muted">
        Rows per page
        <select
          :value="meta.pageSize"
          class="min-h-9 rounded-(--radius-control) border border-line-strong bg-surface px-2 text-fg"
          @change="emit('pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <div class="flex items-center gap-2">
        <AppButton
          size="sm"
          icon="chevronLeft"
          icon-only
          :disabled="meta.page <= 1"
          @click="emit('page', meta.page - 1)"
          >Previous page</AppButton
        >
        <span class="min-w-24 text-center whitespace-nowrap">
          Page {{ formatNumber(meta.page) }} of {{ formatNumber(meta.totalPages) }}
        </span>
        <AppButton
          size="sm"
          icon="chevronRight"
          icon-only
          :disabled="meta.page >= meta.totalPages"
          @click="emit('page', meta.page + 1)"
          >Next page</AppButton
        >
      </div>
    </div>
  </nav>
</template>
