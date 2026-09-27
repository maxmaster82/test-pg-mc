import { useRouter, type RouteLocationRaw } from 'vue-router'
import { errorMessage, isApiError, type ApiError } from '@/shared/api/errors'
import { useNotify } from '@/shared/notifications/store'
import { confirm } from '@/shared/ui/confirm'

interface Deletable {
  id: string
  name: string
}

interface Options<T extends Deletable> {
  /** Lower-case noun used in messages: "ticket", "event", "category". */
  noun: string
  remove: (id: string) => Promise<unknown>
  onDeleted?: (item: T) => unknown
  /**
   * Explains a refused deletion (409, e.g. the record is still referenced) and optionally
   * offers a place to resolve it.
   */
  explainConflict?: (item: T, error: ApiError) => { message: string; resolveTo?: RouteLocationRaw }
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Confirmation → delete → feedback, shared by every entity's list and detail page. */
export function useDeleteWithConfirm<T extends Deletable>(options: Options<T>) {
  const notify = useNotify()
  const router = useRouter()
  const noun = options.noun

  return async function requestDelete(item: T): Promise<boolean> {
    const confirmed = await confirm({
      title: `Delete ${noun}?`,
      message: `"${item.name}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: `Delete ${noun}`,
      tone: 'danger',
    })
    if (!confirmed) return false
    try {
      await options.remove(item.id)
    } catch (error) {
      if (isApiError(error) && error.code === 'CONFLICT' && options.explainConflict) {
        const { message, resolveTo } = options.explainConflict(item, error)
        const goResolve = await confirm({
          title: `${capitalize(noun)} cannot be deleted`,
          message,
          confirmLabel: resolveTo ? 'View tickets' : 'OK',
          cancelLabel: 'Close',
        })
        if (goResolve && resolveTo) await router.push(resolveTo)
      } else {
        notify.error(errorMessage(error))
      }
      return false
    }
    notify.success(`${capitalize(noun)} deleted`)
    await options.onDeleted?.(item)
    return true
  }
}
