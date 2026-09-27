import { onMounted, type Ref } from 'vue'

/**
 * After navigating to another page, focus moves to the new page's <h1> so keyboard and screen
 * reader users start at the top and hear the page name. The router requests it; the heading
 * consumes it when it mounts (which may be after data loads, e.g. on detail pages).
 */
let pending = false

export function requestHeadingFocus() {
  pending = true
}

export function useHeadingFocus(heading: Readonly<Ref<HTMLElement | null>>) {
  onMounted(() => {
    if (!pending || !heading.value) return
    pending = false
    heading.value.focus()
  })
}
