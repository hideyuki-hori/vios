import type { Action } from '@vios/core'
import { requestCloseCurrentTab } from '@vios/platform'
import { openHints } from './hint-ui'
import { createScroller } from './scroller'
import { openTabSwitcher } from './tab-switcher-ui'

const scrollStep = 64

const scroller = createScroller()

const performers: Record<Action, () => void> = {
  scrollDown: () => scroller.scrollBy(scrollStep),
  scrollUp: () => scroller.scrollBy(-scrollStep),
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
}

export const performAction = (action: Action): void => {
  performers[action]()
}
