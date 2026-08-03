export type Key = {
  key: string
  ctrl: boolean
  alt: boolean
  meta: boolean
  shift: boolean
}

export function key(k: string): Key {
  return { key: k, ctrl: false, alt: false, meta: false, shift: false }
}

export function keysEqual(a: Key, b: Key): boolean {
  return (
    a.key === b.key &&
    a.ctrl === b.ctrl &&
    a.alt === b.alt &&
    a.meta === b.meta &&
    a.shift === b.shift
  )
}
