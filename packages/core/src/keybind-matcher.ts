import { type Key, keysEqual } from './key'
import type { Action, Keybind } from './keybind'

export type MatchResult = { type: 'match'; action: Action } | { type: 'pending' } | { type: 'none' }

export type KeybindMatcher = {
  feed: (input: Key) => MatchResult
  reset: () => void
}

function sequenceEquals(a: Key[], b: Key[]): boolean {
  return (
    a.length === b.length &&
    a.every((k, i) => {
      const other = b[i]
      return other !== undefined && keysEqual(k, other)
    })
  )
}

function isProperPrefix(candidate: Key[], sequence: Key[]): boolean {
  return (
    candidate.length < sequence.length &&
    candidate.every((k, i) => {
      const other = sequence[i]
      return other !== undefined && keysEqual(k, other)
    })
  )
}

export function createKeybindMatcher(keybinds: Keybind[]): KeybindMatcher {
  let buffer: Key[] = []

  function feed(input: Key): MatchResult {
    const candidate = [...buffer, input]
    const matched = keybinds.find((keybind) => sequenceEquals(keybind.sequence, candidate))
    if (matched) {
      buffer = []
      return { type: 'match', action: matched.action }
    }
    if (keybinds.some((keybind) => isProperPrefix(candidate, keybind.sequence))) {
      buffer = candidate
      return { type: 'pending' }
    }
    if (buffer.length > 0) {
      buffer = []
      return feed(input)
    }
    return { type: 'none' }
  }

  function reset(): void {
    buffer = []
  }

  return { feed, reset }
}
