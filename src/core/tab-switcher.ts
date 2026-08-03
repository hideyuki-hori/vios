import type { Key } from './key'

export type TabSwitcherEvent =
  | { type: 'selectionChanged'; index: number }
  | { type: 'activate'; index: number }
  | { type: 'closeTab'; index: number }
  | { type: 'newTab' }
  | { type: 'dismiss' }
  | { type: 'none' }

export type TabSwitcher = {
  feed: (input: Key) => TabSwitcherEvent
  selectedIndex: () => number
}

function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(index, 0), count - 1)
}

export function createTabSwitcher(count: number, initialIndex: number): TabSwitcher {
  let selected = clampIndex(initialIndex, count)
  let digits = ''

  function select(index: number): TabSwitcherEvent {
    selected = index
    return { type: 'selectionChanged', index }
  }

  function feedDigit(digit: string): TabSwitcherEvent {
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

  function feed(input: Key): TabSwitcherEvent {
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
        return { type: 'activate', index: selected }
      case 'x':
        return { type: 'closeTab', index: selected }
      case 'n':
        return { type: 'newTab' }
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
