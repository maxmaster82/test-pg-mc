<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage, isApiError } from '@/shared/api/errors'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import { formatDateTime, pluralize } from '@/shared/utils/format'
import { useRequestCategoryDelete } from '../delete'
import { useCategory } from '../queries'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useCategory(() => id)
const category = computed(() => query.data.value)
const notFound = computed(() => isApiError(query.error.value) && query.error.value.status === 404)
const { request, isPending } = useRequestCategoryDelete(() => router.push({ name: 'categories' }))

async function onDelete() {
  if (category.value) await request(category.value)
}
</script>

<template>
  <SkeletonBlock v-if="query.isPending.value" :lines="4" />
  <AppCard v-else-if="notFound">
    <EmptyState
      title="Category not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'categories' }">Back to categories</AppButton>
    </EmptyState>
  </AppCard>
  <AppCard v-else-if="query.isError.value || !category">
    <ErrorState
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
  </AppCard>
  <template v-else>
    <PageHeader :title="category.name">
      <template #breadcrumb>
        <RouterLink
          :to="{ name: 'categories' }"
          class="mb-1 inline-block text-sm text-muted hover:text-fg"
        >
          ← Categories
        </RouterLink>
      </template>
      <template #actions>
        <AppButton icon="edit" :to="{ name: 'category-edit', params: { id } }">Edit</AppButton>
        <AppButton icon="trash" variant="danger" :loading="isPending" @click="onDelete"
          >Delete</AppButton
        >
      </template>
    </PageHeader>
    <AppCard class="p-4 sm:p-6">
      <dl class="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div class="sm:col-span-2 lg:col-span-3">
          <dt class="text-sm text-muted">Description</dt>
          <dd class="mt-1 whitespace-pre-line">{{ category.description || 'No description' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Tickets</dt>
          <dd class="mt-1">
            <RouterLink
              :to="{ name: 'tickets', query: { categoryId: category.id } }"
              class="text-primary hover:underline"
            >
              {{ pluralize(category.ticketCount, 'ticket') }}
            </RouterLink>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Created</dt>
          <dd class="mt-1">{{ formatDateTime(category.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Last updated</dt>
          <dd class="mt-1">{{ formatDateTime(category.updatedAt) }}</dd>
        </div>
      </dl>
    </AppCard>
  </template>
</template>
