<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { errorMessage } from '@/shared/api/errors'
import { useListQueryState } from '@/shared/composables/useListQueryState'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import type { DataColumn } from '@/shared/ui/data-table'
import DataTable from '@/shared/ui/DataTable.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import ListPagination from '@/shared/ui/ListPagination.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import SearchInput from '@/shared/ui/SearchInput.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { formatDateTime, formatNumber } from '@/shared/utils/format'
import { useRequestCategoryDelete } from '../delete'
import { categoryListParamsSchema, type CategoryListParams } from '../list-params'
import { useCategoriesList } from '../queries'

const { params, update, sortBy, keepPageInBounds, clearFilters, hasActiveFilters } =
  useListQueryState(categoryListParamsSchema, { initialOrder: { updatedAt: 'desc' } })
const list = useCategoriesList(params)
keepPageInBounds(() => list.data.value?.meta)
const { request: requestDelete } = useRequestCategoryDelete()
const data = computed(() => list.data.value)

const columns: DataColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'tickets', label: 'Tickets', align: 'end' },
  { key: 'updatedAt', label: 'Updated', sortable: true, priority: 'low' },
]
</script>

<template>
  <PageHeader title="Categories" description="Ticket types offered across events.">
    <template #actions>
      <AppButton variant="primary" icon="plus" :to="{ name: 'category-create' }"
        >New category</AppButton
      >
    </template>
  </PageHeader>

  <AppCard>
    <div
      role="search"
      aria-label="Filter categories"
      class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center"
    >
      <div class="flex-1">
        <SearchInput
          :model-value="params.q"
          label="Search categories by name or description"
          @update:model-value="update({ q: $event }, { replace: true })"
        />
      </div>
      <AppButton v-if="hasActiveFilters" variant="ghost" icon="close" @click="clearFilters()">
        Clear filters
      </AppButton>
    </div>

    <SkeletonBlock v-if="list.isPending.value" :lines="6" />
    <ErrorState
      v-else-if="list.isError.value && !data"
      title="Could not load categories"
      :message="errorMessage(list.error.value)"
      :retrying="list.isFetching.value"
      @retry="list.refetch()"
    />
    <template v-else-if="data">
      <EmptyState
        v-if="data.meta.total === 0 && hasActiveFilters"
        icon="search"
        title="No categories match your search"
        description="Try a different search term."
      >
        <AppButton @click="clearFilters()">Clear filters</AppButton>
      </EmptyState>
      <EmptyState
        v-else-if="data.meta.total === 0"
        icon="tag"
        title="No categories yet"
        description="Categories describe the kinds of tickets you sell, such as VIP or Student."
      >
        <AppButton variant="primary" icon="plus" :to="{ name: 'category-create' }"
          >New category</AppButton
        >
      </EmptyState>
      <template v-else>
        <DataTable
          :columns="columns"
          :rows="data.data"
          :row-key="(c) => c.id"
          caption="Categories"
          :sort="{ field: params.sort, order: params.order }"
          :busy="list.isPlaceholderData.value"
          @sort="sortBy"
        >
          <template #cell-name="{ row }">
            <RouterLink
              :to="{ name: 'category-detail', params: { id: row.id } }"
              class="inline-block py-1.5 font-medium text-fg hover:text-primary hover:underline"
            >
              {{ row.name }}
            </RouterLink>
          </template>
          <template #cell-description="{ row }">
            <span class="line-clamp-2 max-w-md text-muted">{{ row.description || '—' }}</span>
          </template>
          <template #cell-tickets="{ row }">{{ formatNumber(row.ticketCount) }}</template>
          <template #cell-updatedAt="{ row }">
            <span class="whitespace-nowrap text-muted">{{ formatDateTime(row.updatedAt) }}</span>
          </template>
          <template #actions="{ row }">
            <RowActions
              :label="`Actions for ${row.name}`"
              :actions="[
                {
                  label: 'View',
                  icon: 'eye',
                  to: { name: 'category-detail', params: { id: row.id } },
                },
                {
                  label: 'Edit',
                  icon: 'edit',
                  to: { name: 'category-edit', params: { id: row.id } },
                },
                {
                  label: 'Delete',
                  icon: 'trash',
                  danger: true,
                  onSelect: () => requestDelete(row),
                },
              ]"
            />
          </template>
        </DataTable>
        <ListPagination
          :meta="data.meta"
          @page="update({ page: $event })"
          @page-size="update({ pageSize: $event as CategoryListParams['pageSize'] })"
        />
      </template>
    </template>
  </AppCard>
</template>
