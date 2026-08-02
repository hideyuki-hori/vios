import type { Action } from '@vios/core'

const scrollStep = 64

const performers: Record<Action, () => void> = {
  scrollDown: () => window.scrollBy(0, scrollStep),
  scrollUp: () => window.scrollBy(0, -scrollStep),
  scrollToTop: () => window.scrollTo(0, 0),
  scrollToBottom: () => window.scrollTo(0, document.documentElement.scrollHeight),
  historyBack: () => history.back(),
  historyForward: () => history.forward(),
}

export const performAction = (action: Action): void => {
  performers[action]()
}
