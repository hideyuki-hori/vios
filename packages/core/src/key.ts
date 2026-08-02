export type Key = {
  key: string
  ctrl: boolean
  alt: boolean
  meta: boolean
  shift: boolean
}

export const key = (k: string): Key => ({
  key: k,
  ctrl: false,
  alt: false,
  meta: false,
  shift: false,
})

export const keysEqual = (a: Key, b: Key): boolean =>
  a.key === b.key &&
  a.ctrl === b.ctrl &&
  a.alt === b.alt &&
  a.meta === b.meta &&
  a.shift === b.shift
