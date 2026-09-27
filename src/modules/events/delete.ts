import { useDeleteWithConfirm } from '@/shared/composables/useDeleteWithConfirm'
import { pluralize } from '@/shared/utils/format'
import { useDeleteEvent } from './queries'
import type { EventItem } from './types'

/** Delete with confirmation; explains the 409 when the event still has tickets. */
export function useRequestEventDelete(onDeleted?: () => unknown) {
  const remove = useDeleteEvent()
  const request = useDeleteWithConfirm<EventItem>({
    noun: 'event',
    remove: remove.mutateAsync,
    onDeleted,
    explainConflict: (event, error) => {
      const count = Number(error.details?.ticketCount ?? event.ticketCount)
      return {
        message: `${event.name} has ${pluralize(count, 'ticket')}. Delete or move them before deleting the event.`,
        resolveTo: { name: 'tickets', query: { eventId: event.id } },
      }
    },
  })
  return { request, isPending: remove.isPending }
}
