<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEntityCreateForm } from '@/shared/composables/useEntityCreateForm'
import AppCard from '@/shared/ui/AppCard.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import CategoryForm from '../components/CategoryForm.vue'
import { useCreateCategory } from '../queries'
import { emptyCategoryForm, categoryFormSchema } from '../schemas'

const router = useRouter()
const create = useCreateCategory()
const { form, submit } = useEntityCreateForm({
  schema: categoryFormSchema,
  empty: emptyCategoryForm,
  save: create.mutateAsync,
  successMessage: 'Category created',
  onSaved: (category) => router.push({ name: 'category-detail', params: { id: category.id } }),
})
</script>

<template>
  <PageHeader
    title="New category"
    description="Describe a kind of ticket, such as VIP or Student."
  />
  <AppCard class="p-4 sm:p-6">
    <CategoryForm
      :form="form"
      submit-label="Create category"
      :cancel-to="{ name: 'categories' }"
      @submit="submit"
    />
  </AppCard>
</template>
