import type { Key } from './keys.core'

export function filterByQuery<T>(items: T[], query: string, text: (item: T) => string): T[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term !== '')
  if (terms.length === 0) return items
  return items.filter((item) => {
    const haystack = text(item).toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}

export type PaletteItem = {
  id: string
  primary: string
  secondary: string
  searchText: string
}

export type PaletteRow = {
  num: string
  primary: string
  secondary: string
}

export type PaletteView = {
  rows: PaletteRow[]
  selectedIndex: number
  emptyMessage: string | null
  searchFocused: boolean
  query: string
}

export type PaletteEvent<Command extends string> =
  | { type: 'viewChanged' }
  | { type: 'commit'; id: string; alt: boolean }
  | { type: 'command'; command: Command; id: string }
  | { type: 'dismiss' }
  | { type: 'none' }

export type PaletteConfig<Command extends string> = {
  commands: { key: string; command: Command }[]
  emptyMessage: string
}

export type Palette<Command extends string> = {
  feed(input: Key): PaletteEvent<Command>
  setQuery(query: string): void
  setItems(items: PaletteItem[]): void
  setSearchFocused(focused: boolean): void
  view(): PaletteView
}

function clampIndex(index: number, count: number): number {
  if (count === 0) return 0
  return Math.min(Math.max(index, 0), count - 1)
}

export function createPalette<Command extends string>(
  items: PaletteItem[],
  config: PaletteConfig<Command>,
  initialIndex = 0,
): Palette<Command> {
  let all = items
  let query = ''
  let filtered = all
  let selected = clampIndex(initialIndex, filtered.length)
  let searchFocused = false
  let digits = ''

  function refilter(preferredIndex: number): void {
    filtered = filterByQuery(all, query, (item) => item.searchText)
    selected = clampIndex(preferredIndex, filtered.length)
    digits = ''
  }

  function select(index: number): PaletteEvent<Command> {
    selected = index
    return { type: 'viewChanged' }
  }

  function feedDigit(digit: string): PaletteEvent<Command> {
    const appended = digits + digit
    const byAppended = Number(appended)
    if (byAppended >= 1 && byAppended <= filtered.length) {
      digits = appended
      return select(byAppended - 1)
    }
    const bySingle = Number(digit)
    if (bySingle >= 1 && bySingle <= filtered.length) {
      digits = digit
      return select(bySingle - 1)
    }
    digits = ''
    return { type: 'none' }
  }

  function commitSelected(alt: boolean): PaletteEvent<Command> {
    const item = filtered[selected]
    if (item === undefined) return { type: 'none' }
    return { type: 'commit', id: item.id, alt }
  }

  function feedSearchMode(input: Key): PaletteEvent<Command> {
    switch (input.key) {
      case 'Enter': {
        if (filtered.length === 0) return { type: 'none' }
        if (filtered.length === 1) return commitSelected(input.shift)
        searchFocused = false
        return { type: 'viewChanged' }
      }
      case 'Escape': {
        query = ''
        refilter(0)
        searchFocused = false
        return { type: 'viewChanged' }
      }
      case 'ArrowDown':
        return select(clampIndex(selected + 1, filtered.length))
      case 'ArrowUp':
        return select(clampIndex(selected - 1, filtered.length))
      default:
        return { type: 'none' }
    }
  }

  function feed(input: Key): PaletteEvent<Command> {
    if (searchFocused) return feedSearchMode(input)
    if (input.key === '/') {
      searchFocused = true
      return { type: 'viewChanged' }
    }
    if (input.ctrl || input.alt || input.meta) return { type: 'none' }
    if (filtered.length === 0) {
      return input.key === 'Escape' ? { type: 'dismiss' } : { type: 'none' }
    }
    if (/^[0-9]$/.test(input.key)) return feedDigit(input.key)
    digits = ''
    switch (input.key) {
      case 'j':
      case 'ArrowDown':
        return select(clampIndex(selected + 1, filtered.length))
      case 'k':
      case 'ArrowUp':
        return select(clampIndex(selected - 1, filtered.length))
      case 'Enter':
        return commitSelected(input.shift)
      case 'Escape':
        return { type: 'dismiss' }
      default: {
        const binding = config.commands.find((entry) => entry.key === input.key)
        if (binding === undefined) return { type: 'none' }
        const item = filtered[selected]
        if (item === undefined) return { type: 'none' }
        return { type: 'command', command: binding.command, id: item.id }
      }
    }
  }

  return {
    feed,
    setQuery(value) {
      query = value
      refilter(0)
    },
    setItems(nextItems) {
      all = nextItems
      refilter(selected)
    },
    setSearchFocused(focused) {
      searchFocused = focused
    },
    view() {
      return {
        rows: filtered.map((item, index) => ({
          num: String(index + 1),
          primary: item.primary,
          secondary: item.secondary,
        })),
        selectedIndex: selected,
        emptyMessage: filtered.length === 0 ? config.emptyMessage : null,
        searchFocused,
        query,
      }
    },
  }
}
