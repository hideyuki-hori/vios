import { type Key, key, keysEqual } from './keys.core'

export type Action =
  | 'scrollDown'
  | 'scrollUp'
  | 'scrollPageDown'
  | 'scrollPageUp'
  | 'scrollToTop'
  | 'scrollToBottom'
  | 'historyBack'
  | 'historyForward'
  | 'openTabSwitcher'
  | 'openNewTab'
  | 'openOmnibar'
  | 'closeCurrentTab'
  | 'reloadPage'
  | 'enterHintMode'
  | 'openBookmarks'
  | 'toggleMemo'

export type Keybind = {
  sequence: Key[]
  action: Action
}

export const defaultKeybinds: Keybind[] = [
  { sequence: [key('j')], action: 'scrollDown' },
  { sequence: [key('k')], action: 'scrollUp' },
  { sequence: [key('d')], action: 'scrollPageDown' },
  { sequence: [key('u')], action: 'scrollPageUp' },
  { sequence: [key('h')], action: 'historyBack' },
  { sequence: [key('l')], action: 'historyForward' },
  { sequence: [key('g'), key('g')], action: 'scrollToTop' },
  { sequence: [key('G')], action: 'scrollToBottom' },
  { sequence: [key('t')], action: 'openNewTab' },
  { sequence: [key('T')], action: 'openTabSwitcher' },
  { sequence: [key('o')], action: 'openOmnibar' },
  { sequence: [key('x')], action: 'closeCurrentTab' },
  { sequence: [key('r')], action: 'reloadPage' },
  { sequence: [key('f')], action: 'enterHintMode' },
  { sequence: [key('b')], action: 'openBookmarks' },
  { sequence: [key('m')], action: 'toggleMemo' },
]

export type MatchResult = { type: 'match'; action: Action } | { type: 'pending' } | { type: 'none' }

export type KeybindMatcher = {
  feed: (input: Key) => MatchResult
  reset: () => void
}

export function releasableActions(keybinds: Keybind[], releasedKey: string): Action[] {
  return keybinds.flatMap((keybind) => {
    const first = keybind.sequence[0]
    return keybind.sequence.length === 1 &&
      first !== undefined &&
      first.key.toLowerCase() === releasedKey.toLowerCase()
      ? [keybind.action]
      : []
  })
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
