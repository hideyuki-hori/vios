import type { Key } from '~/lib/keys.core'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLSelectElement) return true
  return target.isContentEditable
}

export function shouldIgnore(event: KeyboardEvent): boolean {
  return event.isComposing || event.defaultPrevented || isEditable(event.target)
}

export function toKey(event: KeyboardEvent): Key {
  return {
    key: event.key,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    meta: event.metaKey,
    shift: event.key.length === 1 ? false : event.shiftKey,
  }
}
