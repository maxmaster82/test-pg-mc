import { computed, nextTick, reactive, ref, watch, type Ref } from 'vue'
import type { z } from 'zod'
import type { FieldErrors } from '@/shared/api/types'

type FieldName<T> = Extract<keyof T, string>

export interface FieldBinding<V> {
  name: string
  modelValue: V
  error: string | undefined
  'onUpdate:modelValue': (value: V) => void
  onBlur: () => void
}

/** Maps Zod issues to the first message per top-level field. */
function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '')
    if (key && !(key in result)) result[key] = issue.message
  }
  return result
}

/**
 * Small form-state composable on top of a Zod schema (see ADR 0006).
 * Errors appear after a field is blurred or the form is submitted, then update live.
 */
export function useZodForm<TInput extends Record<string, unknown>, TOutput>(
  schema: z.ZodType<TOutput, TInput>,
  initialValues: TInput,
) {
  const values = reactive(structuredClone(initialValues)) as TInput
  const errors: Ref<FieldErrors> = ref({})
  const touched = reactive(new Set<string>())
  const serverErrors: Ref<FieldErrors> = ref({})
  const isSubmitting = ref(false)
  const baseline = ref(JSON.stringify(initialValues))

  const isDirty = computed(() => JSON.stringify(values) !== baseline.value)

  function computeErrors(): FieldErrors {
    const result = schema.safeParse(values)
    return result.success ? {} : toFieldErrors(result.error)
  }

  function refreshVisibleErrors() {
    const all = computeErrors()
    const visible: FieldErrors = {}
    for (const name of touched) {
      const message = all[name] ?? serverErrors.value[name]
      if (message) visible[name] = message
    }
    errors.value = visible
  }

  watch(
    () => JSON.stringify(values),
    () => {
      if (touched.size > 0) refreshVisibleErrors()
    },
  )

  function touch(name: FieldName<TInput>) {
    touched.add(name)
    refreshVisibleErrors()
  }

  function setValue<K extends FieldName<TInput>>(name: K, value: TInput[K]) {
    values[name] = value
    if (name in serverErrors.value) {
      serverErrors.value = Object.fromEntries(
        Object.entries(serverErrors.value).filter(([key]) => key !== name),
      )
    }
  }

  /** Props + listeners for a field component: `<TextField v-bind="form.field('name')" />`. */
  function field<K extends FieldName<TInput>>(name: K): FieldBinding<TInput[K]> {
    return {
      name,
      modelValue: values[name],
      error: errors.value[name],
      'onUpdate:modelValue': (value) => {
        setValue(name, value)
      },
      onBlur: () => {
        touch(name)
      },
    }
  }

  /** Shows errors returned by the API (422) next to their fields. */
  function setServerErrors(fieldErrors: FieldErrors) {
    serverErrors.value = fieldErrors
    for (const name of Object.keys(fieldErrors)) touched.add(name)
    refreshVisibleErrors()
  }

  function reset(next: TInput = JSON.parse(baseline.value) as TInput) {
    Object.assign(values, structuredClone(next))
    baseline.value = JSON.stringify(next)
    touched.clear()
    serverErrors.value = {}
    errors.value = {}
  }

  async function focusFirstInvalid(form: HTMLFormElement | null) {
    await nextTick()
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }

  function handleSubmit(onValid: (data: TOutput) => Promise<void> | void) {
    return async (event?: Event) => {
      event?.preventDefault()
      const form = event?.target instanceof HTMLFormElement ? event.target : null
      const submitter = event instanceof SubmitEvent ? event.submitter : null
      for (const name of Object.keys(values)) touched.add(name)
      serverErrors.value = {}
      const result = schema.safeParse(values)
      if (!result.success) {
        errors.value = toFieldErrors(result.error)
        await focusFirstInvalid(form)
        return
      }
      errors.value = {}
      isSubmitting.value = true
      try {
        await onValid(result.data)
      } finally {
        isSubmitting.value = false
      }
      if (Object.keys(errors.value).length > 0) {
        await focusFirstInvalid(form)
      } else if (submitter?.isConnected && document.activeElement === document.body) {
        // The busy submit button was disabled, which drops focus; restore it (e.g. after a failed save).
        await nextTick()
        submitter.focus()
      }
    }
  }

  return {
    values,
    errors,
    isDirty,
    isSubmitting,
    field,
    touch,
    setValue,
    setServerErrors,
    reset,
    handleSubmit,
  }
}

export type ZodForm<TInput extends Record<string, unknown>, TOutput> = ReturnType<
  typeof useZodForm<TInput, TOutput>
>
