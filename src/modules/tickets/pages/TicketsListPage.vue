<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useCategoryOptions } from '@/modules/categories/lookups'
import { useEventName, useEventOptions } from '@/modules/events/lookups'
import { errorMessage } from '@/shared/api/errors'
import { useListQueryState } from '@/shared/composables/useListQueryState'
import { useDeleteWithConfirm } from '@/shared/composables/useDeleteWithConfirm'
import { useNotify } from '@/shared/notifications/store'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCheckbox from '@/shared/ui/AppCheckbox.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import AsyncCombobox from '@/shared/ui/AsyncCombobox.vue'
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
import { formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format'
import BulkActionBar from '../bulk/BulkActionBar.vue'
import { describeBulkResult } from '../bulk/describe-result'
import { useBulkUpdateTicketStatus } from '../bulk/useBulkUpdateTicketStatus'
import { useTicketSelection } from '../bulk/useTicketSelection'
import TicketStatusBadge from '../components/TicketStatusBadge.vue'
import { ticketListParamsSchema, type TicketListParams } from '../list-params'
import { TICKET_STATUS_OPTIONS } from '../options'
import { useDeleteTicket, useTicketsList } from '../queries'
import type { Ticket, TicketStatus } from '../types'

const { params, update, sortBy, keepPageInBounds, clearFilters, hasActiveFilters } =
  useListQueryState(ticketListParamsSchema, { initialOrder: { updatedAt: 'desc' } })
const list = useTicketsList(params)
keepPageInBounds(() => list.data.value?.meta)
const remove = useDeleteTicket()
const requestDelete = useDeleteWithConfirm<Ticket>({ noun: 'ticket', remove: remove.mutateAsync })
const notify = useNotify()

// ---- Bulk status change (optimistic, see ADR 0005) ----
const selection = useTicketSelection()
const bulk = useBulkUpdateTicketStatus()
/** Tickets the server refused in the last bulk action, with the reason shown in the row. */
const bulkFailures = ref(new Map<string, string>())
const selectionAnnouncement = ref('')

// A selection only makes sense for the result set it was made in.
watch(
  () =>
    [params.value.q, params.value.status, params.value.eventId, params.value.categoryId].join('|'),
  () => {
    bulkFailures.value = new Map()
    if (selection.count.value === 0) return
    selection.clear()
    selectionAnnouncement.value = 'Selection cleared because the filters changed.'
  },
)

async function applyBulkStatus(status: TicketStatus) {
  bulkFailures.value = new Map()
  selectionAnnouncement.value = ''
  try {
    const result = await bulk.mutateAsync({ ids: selection.ids.value, status })
    const message = describeBulkResult(result, status)
    if (result.failed.length === 0) {
      notify.success(message)
      return
    }
    // Keep only the refused tickets selected so they can be fixed and retried.
    selection.keepOnly(result.failed.map((f) => f.id))
    bulkFailures.value = new Map(result.failed.map((f) => [f.id, f.message]))
    notify.error(message)
  } catch {
    notify.error('Could not update tickets. No changes were saved.')
  }
}

const categories = useCategoryOptions()
const eventSearch = ref('')
const events = useEventOptions(eventSearch)
const selectedEventName = useEventName(() => params.value.eventId)

const columns: DataColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'event', label: 'Event' },
  { key: 'category', label: 'Category', priority: 'low' },
  { key: 'price', label: 'Price', sortable: true, align: 'end' },
  { key: 'quantity', label: 'Quantity', sortable: true, align: 'end' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'updatedAt', label: 'Updated', sortable: true, priority: 'low' },
]

const data = computed(() => list.data.value)
const showSkeleton = computed(() => list.isPending.value)
</script>

<template>
  <PageHeader title="Tickets" description="Prices, inventory and sale status across all events.">
    <template #actions>
      <AppButton variant="primary" icon="plus" :to="{ name: 'ticket-create' }"
        >New ticket</AppButton
      >
    </template>
  </PageHeader>

  <p role="status" class="sr-only">{{ selectionAnnouncement }}</p>
  <AppCard>
    <div
      role="search"
      aria-label="Filter tickets"
      class="grid gap-3 border-b border-line p-4 md:grid-cols-3 md:items-end xl:grid-cols-[2fr_1fr_1.5fr_1fr_auto]"
    >
      <div class="md:col-span-3 xl:col-span-1">
        <SearchInput
          :model-value="params.q"
          label="Search tickets by name"
          @update:model-value="update({ q: $event }, { replace: true })"
        />
      </div>
      <FilterPanel
        :active-count="[params.status, params.eventId, params.categoryId].filter(Boolean).length"
      >
        <SelectField
          :model-value="params.status ?? ''"
          label="Status"
          :options="TICKET_STATUS_OPTIONS"
          placeholder="All statuses"
          @update:model-value="
            update({ status: ($event || undefined) as TicketStatus | undefined })
          "
        />
        <AsyncCombobox
          :model-value="params.eventId ?? ''"
          label="Event"
          :options="events.options.value"
          :loading="events.isFetching.value"
          :selected-label="selectedEventName"
          placeholder="All events"
          @update:model-value="update({ eventId: $event || undefined })"
          @search="eventSearch = $event"
        />
        <SelectField
          :model-value="params.categoryId ?? ''"
          label="Category"
          :options="categories.options.value"
          placeholder="All categories"
          @update:model-value="update({ categoryId: $event || undefined })"
        />
        <AppButton v-if="hasActiveFilters" variant="ghost" icon="close" @click="clearFilters()">
          Clear filters
        </AppButton>
      </FilterPanel>
    </div>

    <SkeletonBlock v-if="showSkeleton" :lines="8" />
    <ErrorState
      v-else-if="list.isError.value && !data"
      title="Could not load tickets"
      :message="errorMessage(list.error.value)"
      :retrying="list.isFetching.value"
      @retry="list.refetch()"
    />
    <template v-else-if="data">
      <EmptyState
        v-if="data.meta.total === 0 && hasActiveFilters"
        icon="search"
        title="No tickets match your filters"
        description="Try a different search term or remove some filters."
      >
        <AppButton @click="clearFilters()">Clear filters</AppButton>
      </EmptyState>
      <EmptyState
        v-else-if="data.meta.total === 0"
        icon="ticket"
        title="No tickets yet"
        description="Create the first ticket type for one of your events."
      >
        <AppButton variant="primary" icon="plus" :to="{ name: 'ticket-create' }"
          >New ticket</AppButton
        >
      </EmptyState>
      <template v-else>
        <DataTable
          :columns="columns"
          :rows="data.data"
          :row-key="(t) => t.id"
          caption="Tickets"
          :sort="{ field: params.sort, order: params.order }"
          :busy="list.isPlaceholderData.value || bulk.isPending.value"
          @sort="sortBy"
        >
          <template #selectAll>
            <AppCheckbox
              label="Select all tickets on this page"
              :model-value="selection.pageState(data.data) === 'all'"
              :indeterminate="selection.pageState(data.data) === 'some'"
              @update:model-value="selection.togglePage(data.data)"
            />
          </template>
          <template #select="{ row }">
            <AppCheckbox
              :label="`Select ${row.name}`"
              :model-value="selection.isSelected(row.id)"
              @update:model-value="selection.toggle(row)"
            />
          </template>
          <template #cell-name="{ row }">
            <RouterLink
              :to="{ name: 'ticket-detail', params: { id: row.id } }"
              class="inline-block py-1.5 font-medium text-fg hover:text-primary hover:underline"
            >
              {{ row.name }}
            </RouterLink>
          </template>
          <template #cell-event="{ row }">{{ row.event.name }}</template>
          <template #cell-category="{ row }">{{ row.category.name }}</template>
          <template #cell-price="{ row }">{{ formatMoney(row.price, row.currency) }}</template>
          <template #cell-quantity="{ row }">{{ formatNumber(row.quantity) }}</template>
          <template #cell-status="{ row }">
            <TicketStatusBadge :status="row.status" />
            <span v-if="bulkFailures.has(row.id)" class="mt-1 block text-xs text-danger">
              Not updated: {{ bulkFailures.get(row.id) }}
            </span>
          </template>
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
                  to: { name: 'ticket-detail', params: { id: row.id } },
                },
                {
                  label: 'Edit',
                  icon: 'edit',
                  to: { name: 'ticket-edit', params: { id: row.id } },
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
        <BulkActionBar
          v-if="selection.count.value > 0"
          :count="selection.count.value"
          :pending="bulk.isPending.value"
          @apply="applyBulkStatus"
          @clear="selection.clear()"
        />
        <ListPagination
          :meta="data.meta"
          @page="update({ page: $event })"
          @page-size="update({ pageSize: $event as TicketListParams['pageSize'] })"
        />
      </template>
    </template>
  </AppCard>
</template>
