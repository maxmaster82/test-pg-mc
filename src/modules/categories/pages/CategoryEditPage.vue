<script setup lang="ts">
import { useRouter } from 'vue-router'
import { errorMessage } from '@/shared/api/errors'
import { useEntityEditForm } from '@/shared/composables/useEntityEditForm'
import AppButton from '@/shared/ui/AppButton.vue'
import AppCard from '@/shared/ui/AppCard.vue'
import ConflictNotice from '@/shared/ui/ConflictNotice.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import ErrorState from '@/shared/ui/ErrorState.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import SkeletonBlock from '@/shared/ui/SkeletonBlock.vue'
import CategoryForm from '../components/CategoryForm.vue'
import { useCategory, useUpdateCategory } from '../queries'
import { categoryFormSchema, emptyCategoryForm, toCategoryFormValues } from '../schemas'

const { id } = defineProps<{ id: string }>()

const router = useRouter()
const query = useCategory(() => id)
const update = useUpdateCategory()
const { form, loaded, conflict, notFound, reloadLatest, submit } = useEntityEditForm({
  query,
  schema: categoryFormSchema,
  empty: emptyCategoryForm,
  toFormValues: toCategoryFormValues,
  save: update.mutateAsync,
  successMessage: 'Category saved',
  onSaved: (category) => router.push({ name: 'category-detail', params: { id: category.id } }),
})
</script>

<template>
  <PageHeader :title="loaded ? `Edit ${loaded.name}` : 'Edit category'" />
  <AppCard class="p-4 sm:p-6">
    <SkeletonBlock v-if="query.isPending.value" :lines="3" />
    <EmptyState
      v-else-if="notFound"
      title="Category not found"
      description="It may have been deleted by another administrator."
    >
      <AppButton :to="{ name: 'categories' }">Back to categories</AppButton>
    </EmptyState>
    <ErrorState
      v-else-if="query.isError.value && !loaded"
      :message="errorMessage(query.error.value)"
      :retrying="query.isFetching.value"
      @retry="query.refetch()"
    />
    <template v-else-if="loaded">
      <ConflictNotice v-if="conflict" noun="category" @reload="reloadLatest" />
      <CategoryForm
        :form="form"
        submit-label="Save changes"
        :cancel-to="{ name: 'category-detail', params: { id } }"
        @submit="submit"
      />
    </template>
  </AppCard>
</template>
