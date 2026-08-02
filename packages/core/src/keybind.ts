import { type Key, key } from './key'

export type Action =
  | 'scrollDown'
  | 'scrollUp'
  | 'scrollToTop'
  | 'scrollToBottom'
  | 'historyBack'
  | 'historyForward'
  | 'openTabSwitcher'
  | 'closeCurrentTab'
  | 'reloadPage'
  | 'enterHintMode'
  | 'openBookmarks'

export type Keybind = {
  sequence: Key[]
  action: Action
}

export const defaultKeybinds: Keybind[] = [
  { sequence: [key('j')], action: 'scrollDown' },
  { sequence: [key('k')], action: 'scrollUp' },
  { sequence: [key('h')], action: 'historyBack' },
  { sequence: [key('l')], action: 'historyForward' },
  { sequence: [key('g'), key('g')], action: 'scrollToTop' },
  { sequence: [key('G')], action: 'scrollToBottom' },
  { sequence: [key('t')], action: 'openTabSwitcher' },
  { sequence: [key('x')], action: 'closeCurrentTab' },
  { sequence: [key('r')], action: 'reloadPage' },
  { sequence: [key('f')], action: 'enterHintMode' },
  { sequence: [key('b')], action: 'openBookmarks' },
]
