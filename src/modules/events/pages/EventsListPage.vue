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
import FilterPanel from '@/shared/ui/FilterPanel.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import ListPagination from '@/shared/ui/ListPagination.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import SearchInput from '@/shared/ui/SearchInput.vue'
import SelectField from '@/shared/ui/SelectField.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { formatCountry, formatDateTime, formatNumber } from '@/shared/utils/format'
import EventStatusBadge from '../components/EventStatusBadge.vue'
import { COUNTRY_OPTIONS } from '../countries'
import { useRequestEventDelete } from '../delete'
import { eventListParamsSchema, type EventListParams } from '../list-params'
import { EVENT_STATUS_OPTIONS } from '../options'
import { useEventsList } from '../queries'
import type { EventStatus } from '../types'

const { params, update, sortBy, keepPageInBounds, clearFilters, hasActiveFilters } =
  useListQueryState(eventListParamsSchema)
const list = useEventsList(params)
keepPageInBounds(() => list.data.value?.meta)
const { request: requestDelete } = useRequestEventDelete()
const data = computed(() => list.data.value)

const columns: DataColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'venue', label: 'Venue' },
  { key: 'country', label: 'Country', priority: 'low' },
  { key: 'startDate', label: 'Starts', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'tickets', label: 'Tickets', align: 'end', priority: 'low' },
]
</script>

<template>
  <PageHeader title="Events" description="Dates, venues and event status.">
    <template #actions>
      <AppButton variant="primary" icon="plus" :to="{ name: 'event-create' }">New event</AppButton>
    </template>
  </PageHeader>

  <AppCard>
    <div
      role="search"
      aria-label="Filter events"
      class="grid gap-3 border-b border-line p-4 md:grid-cols-2 md:items-end xl:grid-cols-[2fr_1fr_1fr_auto]"
    >
      <div class="md:col-span-2 xl:col-span-1">
        <SearchInput
          :model-value="params.q"
          label="Search events by name or venue"
          @update:model-value="update({ q: $event }, { replace: true })"
        />
      </div>
      <FilterPanel :active-count="[params.status, params.country].filter(Boolean).length">
        <SelectField
          :model-value="params.status ?? ''"
          label="Status"
          :options="EVENT_STATUS_OPTIONS"
          placeholder="All statuses"
          @update:model-value="update({ status: ($event || undefined) as EventStatus | undefined })"
        />
        <SelectField
          :model-value="params.country ?? ''"
          label="Country"
          :options="COUNTRY_OPTIONS"
          placeholder="All countries"
          @update:model-value="
            update({ country: ($event || undefined) as EventListParams['country'] })
          "
        />
        <AppButton v-if="hasActiveFilters" variant="ghost" icon="close" @click="clearFilters()">
          Clear filters
        </AppButton>
      </FilterPanel>
    </div>

    <SkeletonBlock v-if="list.isPending.value" :lines="8" />
    <ErrorState
      v-else-if="list.isError.value && !data"
      title="Could not load events"
      :message="errorMessage(list.error.value)"
      :retrying="list.isFetching.value"
      @retry="list.refetch()"
    />
    <template v-else-if="data">
      <EmptyState
        v-if="data.meta.total === 0 && hasActiveFilters"
        icon="search"
        title="No events match your filters"
        description="Try a different search term or remove some filters."
      >
        <AppButton @click="clearFilters()">Clear filters</AppButton>
      </EmptyState>
      <EmptyState
        v-else-if="data.meta.total === 0"
        icon="calendar"
        title="No events yet"
        description="Create an event to start selling tickets for it."
      >
        <AppButton variant="primary" icon="plus" :to="{ name: 'event-create' }"
          >New event</AppButton
        >
      </EmptyState>
      <template v-else>
        <DataTable
          :columns="columns"
          :rows="data.data"
          :row-key="(e) => e.id"
          caption="Events"
          :sort="{ field: params.sort, order: params.order }"
          :busy="list.isPlaceholderData.value"
          @sort="sortBy"
        >
          <template #cell-name="{ row }">
            <RouterLink
              :to="{ name: 'event-detail', params: { id: row.id } }"
              class="inline-block py-1.5 font-medium text-fg hover:text-primary hover:underline"
            >
              {{ row.name }}
            </RouterLink>
          </template>
          <template #cell-venue="{ row }">{{ row.venue }}</template>
          <template #cell-country="{ row }">{{ formatCountry(row.country) }}</template>
          <template #cell-startDate="{ row }">
            <span class="whitespace-nowrap">{{ formatDateTime(row.startDate) }}</span>
          </template>
          <template #cell-status="{ row }"><EventStatusBadge :status="row.status" /></template>
          <template #cell-tickets="{ row }">{{ formatNumber(row.ticketCount) }}</template>
          <template #actions="{ row }">
            <RowActions
              :label="`Actions for ${row.name}`"
              :actions="[
                {
                  label: 'View',
                  icon: 'eye',
                  to: { name: 'event-detail', params: { id: row.id } },
                },
                { label: 'Edit', icon: 'edit', to: { name: 'event-edit', params: { id: row.id } } },
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
          @page-size="update({ pageSize: $event as EventListParams['pageSize'] })"
        />
      </template>
    </template>
  </AppCard>
</template>
