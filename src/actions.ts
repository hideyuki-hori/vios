import type { Action } from './core'
import { openBookmarkPalette } from './bookmark-ui'
import { openHints } from './hint-ui'
import { requestCloseCurrentTab } from './messaging'
import { createScroller } from './scroller'
import { openTabSwitcher } from './tab-switcher-ui'

const scrollStep = 64
const pageOverlapPx = 48

const scroller = createScroller()

function pageStep(): number {
  return Math.max(window.innerHeight - pageOverlapPx, scrollStep)
}

const performers: Record<Action, (repeat: boolean) => void> = {
  scrollDown(repeat) {
    if (!repeat) scroller.startHold(1, scrollStep)
  },
  scrollUp(repeat) {
    if (!repeat) scroller.startHold(-1, scrollStep)
  },
  scrollPageDown() {
    scroller.scrollBy(pageStep())
  },
  scrollPageUp() {
    scroller.scrollBy(-pageStep())
  },
  scrollToTop() {
    scroller.scrollTo(0)
  },
  scrollToBottom() {
    scroller.scrollTo(Number.POSITIVE_INFINITY)
  },
  historyBack() {
    history.back()
  },
  historyForward() {
    history.forward()
  },
  openTabSwitcher() {
    void openTabSwitcher()
  },
  closeCurrentTab() {
    void requestCloseCurrentTab()
  },
  reloadPage() {
    location.reload()
  },
  enterHintMode() {
    openHints()
  },
  openBookmarks() {
    void openBookmarkPalette()
  },
}

export function performAction(action: Action, repeat: boolean): void {
  performers[action](repeat)
}

export function releaseAction(action: Action): void {
  if (action === 'scrollDown') scroller.stopHold(1)
  if (action === 'scrollUp') scroller.stopHold(-1)
}
