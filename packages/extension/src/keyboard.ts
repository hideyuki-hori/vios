import type { Key } from '@vios/core'

const isEditable = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLSelectElement) return true
  return target.isContentEditable
}

export const shouldIgnore = (event: KeyboardEvent): boolean =>
  event.isComposing || event.defaultPrevented || isEditable(event.target)

export const toKey = (event: KeyboardEvent): Key => ({
  key: event.key,
  ctrl: event.ctrlKey,
  alt: event.altKey,
  meta: event.metaKey,
  shift: event.key.length === 1 ? false : event.shiftKey,
})
