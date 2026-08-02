export { filterByQuery } from './filter'
export { type Key, key, keysEqual } from './key'
export { type Action, defaultKeybinds, type Keybind } from './keybind'
export {
  createKeybindMatcher,
  type KeybindMatcher,
  type MatchResult,
} from './keybind-matcher'
export type { BackgroundRequest } from './messages'
export type { TabSummary } from './tab'
export {
  createTabSwitcher,
  type TabSwitcher,
  type TabSwitcherEvent,
} from './tab-switcher'

export const extensionName = 'vios'
