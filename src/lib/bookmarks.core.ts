import type { Key } from './keys.core'

export type BookmarkSummary = {
  id: string
  title: string
  url: string
  path: string
}

export type BookmarkRequest = { type: 'listBookmarks' }

export type BookmarkNavigatorEvent =
  | { type: 'selectionChanged'; index: number }
  | { type: 'open'; index: number; newTab: boolean }
  | { type: 'dismiss' }
  | { type: 'none' }

export type BookmarkNavigator = {
  feed: (input: Key) => BookmarkNavigatorEvent
  selectedIndex: () => number
}

function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), count - 1)
}

export function createBookmarkNavigator(count: number, initialIndex: number): BookmarkNavigator {
  let selected = clampIndex(initialIndex, count)
  let digits = ''

  function select(index: number): BookmarkNavigatorEvent {
    selected = index
    return { type: 'selectionChanged', index }
  }

  function feedDigit(digit: string): BookmarkNavigatorEvent {
    const appended = digits + digit
    const byAppended = Number(appended)
    if (byAppended >= 1 && byAppended <= count) {
      digits = appended
      return select(byAppended - 1)
    }
    const bySingle = Number(digit)
    if (bySingle >= 1 && bySingle <= count) {
      digits = digit
      return select(bySingle - 1)
    }
    digits = ''
    return { type: 'none' }
  }

  function feed(input: Key): BookmarkNavigatorEvent {
    if (input.ctrl || input.alt || input.meta) return { type: 'none' }
    if (/^[0-9]$/.test(input.key)) return feedDigit(input.key)
    digits = ''
    switch (input.key) {
      case 'j':
      case 'ArrowDown':
        return select(clampIndex(selected + 1, count))
      case 'k':
      case 'ArrowUp':
        return select(clampIndex(selected - 1, count))
      case 'Enter':
        return { type: 'open', index: selected, newTab: input.shift }
      case 'Escape':
        return { type: 'dismiss' }
      default:
        return { type: 'none' }
    }
  }

  return {
    feed,
    selectedIndex() {
      return selected
    },
  }
}
