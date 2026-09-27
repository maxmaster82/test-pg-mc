import type { z } from 'zod'
import { useNotify } from '@/shared/notifications/store'
import { handleSaveError } from '@/shared/validation/save-errors'
import { useZodForm } from '@/shared/validation/useZodForm'
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

interface Options<E, TForm extends Record<string, unknown>, TInput> {
  schema: z.ZodType<TInput, TForm>
  empty: () => TForm
  save: (input: TInput) => Promise<E>
  successMessage: string
  onSaved: (entity: E) => unknown
}

/** Create-page behavior shared by every entity: validate, save, announce, guard unsaved changes. */
export function useEntityCreateForm<E, TForm extends Record<string, unknown>, TInput>(
  options: Options<E, TForm, TInput>,
) {
  const notify = useNotify()
  const form = useZodForm(options.schema, options.empty())
  const guard = useUnsavedChangesGuard(form.isDirty)

  const submit = form.handleSubmit(async (input) => {
    try {
      const entity = await options.save(input)
      notify.success(options.successMessage)
      guard.allowLeave()
      await options.onSaved(entity)
    } catch (error) {
      handleSaveError(error, { setServerErrors: form.setServerErrors, notifyError: notify.error })
    }
  })

  return { form, submit }
}
