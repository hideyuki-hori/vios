import type { Action } from '@vios/core'
import { createScroller } from './scroller'

const scrollStep = 64

const scroller = createScroller()

const performers: Record<Action, () => void> = {
  scrollDown: () => scroller.scrollBy(scrollStep),
  scrollUp: () => scroller.scrollBy(-scrollStep),
  scrollToTop: () => scroller.scrollTo(0),
  scrollToBottom: () => scroller.scrollTo(Number.POSITIVE_INFINITY),
  historyBack: () => history.back(),
  historyForward: () => history.forward(),
}

export const performAction = (action: Action): void => {
  performers[action]()
}
