import type { Action } from '@vios/core'
import { requestCloseCurrentTab } from '@vios/platform'
import { openBookmarkPalette } from './bookmark-ui'
import { openHints } from './hint-ui'
import { createScroller } from './scroller'
import { openTabSwitcher } from './tab-switcher-ui'

const scrollStep = 64

const scroller = createScroller()

const performers: Record<Action, (repeat: boolean) => void> = {
  scrollDown: (repeat) => {
    if (!repeat) scroller.startHold(1, scrollStep)
  },
  scrollUp: (repeat) => {
    if (!repeat) scroller.startHold(-1, scrollStep)
  },
  scrollToTop: () => scroller.scrollTo(0),
  scrollToBottom: () => scroller.scrollTo(Number.POSITIVE_INFINITY),
  historyBack: () => history.back(),
  historyForward: () => history.forward(),
  openTabSwitcher: () => {
    void openTabSwitcher()
  },
  closeCurrentTab: () => {
    void requestCloseCurrentTab()
  },
  reloadPage: () => {
    location.reload()
  },
  enterHintMode: () => {
    openHints()
  },
  openBookmarks: () => {
    void openBookmarkPalette()
  },
}

export const performAction = (action: Action, repeat: boolean): void => {
  performers[action](repeat)
}

export const releaseAction = (action: Action): void => {
  if (action === 'scrollDown') scroller.stopHold(1)
  if (action === 'scrollUp') scroller.stopHold(-1)
}
