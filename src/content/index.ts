import { performAction, releaseAction } from './actions'
import { handleBookmarkKeydown, isBookmarkPaletteOpen } from './bookmarks.view'
import { handleHintKeydown, isHintModeActive } from './hint.view'
import { createKeybindMatcher, defaultKeybinds, releasableActions } from './keybinds.core'
import { shouldIgnore, toKey } from './keys.to-key'
import { handleOmnibarKeydown, isOmnibarOpen } from './omnibar.view'
import { handleTabSwitcherKeydown, isTabSwitcherOpen } from './tab-switcher.view'

const sequenceTimeoutMs = 1000

const matcher = createKeybindMatcher(defaultKeybinds)
let pendingTimer: number | undefined

function clearPendingTimer(): void {
  if (pendingTimer !== undefined) {
    window.clearTimeout(pendingTimer)
    pendingTimer = undefined
  }
}

window.addEventListener(
  'keydown',
  (event) => {
    if (isOmnibarOpen()) {
      handleOmnibarKeydown(event)
      return
    }
    if (isTabSwitcherOpen()) {
      handleTabSwitcherKeydown(event)
      return
    }
    if (isBookmarkPaletteOpen()) {
      handleBookmarkKeydown(event)
      return
    }
    if (isHintModeActive()) {
      handleHintKeydown(event)
      return
    }
    if (shouldIgnore(event)) return
    clearPendingTimer()
    if (event.key === 'Escape') {
      matcher.reset()
      return
    }
    const result = matcher.feed(toKey(event))
    if (result.type === 'none') return
    event.preventDefault()
    event.stopPropagation()
    if (result.type === 'pending') {
      pendingTimer = window.setTimeout(() => {
        matcher.reset()
        pendingTimer = undefined
      }, sequenceTimeoutMs)
      return
    }
    performAction(result.action, event.repeat)
  },
  true,
)

window.addEventListener(
  'keyup',
  (event) => {
    for (const action of releasableActions(defaultKeybinds, event.key)) {
      releaseAction(action)
    }
  },
  true,
)
