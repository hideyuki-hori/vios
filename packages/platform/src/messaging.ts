import type { BookmarkSummary, TabSummary } from '@vios/core'

export const requestListTabs = (): Promise<TabSummary[]> =>
  chrome.runtime.sendMessage({ type: 'listTabs' })

export const requestActivateTab = (tabId: number): Promise<void> =>
  chrome.runtime.sendMessage({ type: 'activateTab', tabId })

export const requestCloseTab = (tabId: number): Promise<void> =>
  chrome.runtime.sendMessage({ type: 'closeTab', tabId })

export const requestCloseCurrentTab = (): Promise<void> =>
  chrome.runtime.sendMessage({ type: 'closeCurrentTab' })

export const requestCreateTab = (url?: string): Promise<void> =>
  chrome.runtime.sendMessage({ type: 'createTab', url })

export const requestListBookmarks = (): Promise<BookmarkSummary[]> =>
  chrome.runtime.sendMessage({ type: 'listBookmarks' })
