import { openBookmarkPalette } from '../../lib/bookmarks.view'
import { openHints } from '../../lib/hint.view'
import type { Action } from '../../lib/keybinds.core'
import { createScroller } from '../../lib/scroll.driver'
import { openTabSwitcher } from '../../lib/tab-switcher.view'
import { requestCloseCurrentTab } from '../../lib/tabs.client'

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
