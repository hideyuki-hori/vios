import { createKeybindMatcher, defaultKeybinds } from '@vios/core'
import { performAction } from './actions'
import { shouldIgnore, toKey } from './keyboard'
import { handleTabSwitcherKeydown, isTabSwitcherOpen } from './tab-switcher-ui'

const sequenceTimeoutMs = 1000

const matcher = createKeybindMatcher(defaultKeybinds)
let pendingTimer: number | undefined

const clearPendingTimer = () => {
  if (pendingTimer !== undefined) {
    window.clearTimeout(pendingTimer)
    pendingTimer = undefined
  }
}

window.addEventListener(
  'keydown',
  (event) => {
    if (isTabSwitcherOpen()) {
      handleTabSwitcherKeydown(event)
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
    performAction(result.action)
  },
  true,
)
