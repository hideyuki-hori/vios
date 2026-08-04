import { openBookmarkPalette } from './bookmarks.view'
import { openHints } from './hint.view'
import type { Action } from './keybinds.core'
import { createScroller } from './scroll.driver'
import { openTabSwitcher } from './tab-switcher.view'
import { requestCloseCurrentTab, requestCreateTab } from './tabs.client'

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
  openNewTab() {
    void requestCreateTab()
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
