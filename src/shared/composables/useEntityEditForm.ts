import type { UseQueryReturnType } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import type { z } from 'zod'
import { isApiError } from '@/shared/api/errors'
import { useNotify } from '@/shared/notifications/store'
import { handleSaveError } from '@/shared/validation/save-errors'
import { useZodForm } from '@/shared/validation/useZodForm'
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

interface Versioned {
  id: string
  version: number
}

interface Options<E extends Versioned, TForm extends Record<string, unknown>, TInput> {
  query: UseQueryReturnType<E, Error>
  schema: z.ZodType<TInput, TForm>
  empty: () => TForm
  toFormValues: (entity: E) => TForm
  save: (args: { id: string; input: TInput; version: number }) => Promise<E>
  successMessage: string
  onSaved: (entity: E) => unknown
}

/**
 * Edit-page behavior shared by every entity: load once into a form, save with the version the
 * form was loaded from (so background refetches cannot hide a concurrent edit), surface 409s,
 * map 422s to fields and guard unsaved changes.
 */
export function useEntityEditForm<
  E extends Versioned,
  TForm extends Record<string, unknown>,
  TInput,
>(options: Options<E, TForm, TInput>) {
  const notify = useNotify()
  const form = useZodForm(options.schema, options.empty())
  const guard = useUnsavedChangesGuard(form.isDirty)
  const loaded = ref<E | null>(null)
  const conflict = ref(false)

  function load(entity: E) {
    loaded.value = entity
    conflict.value = false
    form.reset(options.toFormValues(entity))
  }

  watch(
    () => options.query.data.value,
    (entity) => {
      if (entity && !loaded.value) load(entity)
    },
    { immediate: true },
  )

  const notFound = computed(
    () => isApiError(options.query.error.value) && options.query.error.value.status === 404,
  )

  async function reloadLatest() {
    const result = await options.query.refetch()
    if (result.data) load(result.data)
  }

  const submit = form.handleSubmit(async (input) => {
    const current = loaded.value
    if (!current) return
    try {
      const saved = await options.save({ id: current.id, input, version: current.version })
      notify.success(options.successMessage)
      guard.allowLeave()
      await options.onSaved(saved)
    } catch (error) {
      const failure = handleSaveError(error, {
        setServerErrors: form.setServerErrors,
        notifyError: notify.error,
      })
      if (failure === 'conflict') conflict.value = true
    }
  })

  return { form, loaded, conflict, notFound, reloadLatest, submit }
}
