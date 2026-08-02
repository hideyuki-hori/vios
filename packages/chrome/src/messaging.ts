import type { BookmarkSummary, TabSummary } from '@vios/core'

export function requestListTabs(): Promise<TabSummary[]> {
  return chrome.runtime.sendMessage({ type: 'listTabs' })
}

export function requestActivateTab(tabId: number): Promise<void> {
  return chrome.runtime.sendMessage({ type: 'activateTab', tabId })
}

export function requestCloseTab(tabId: number): Promise<void> {
  return chrome.runtime.sendMessage({ type: 'closeTab', tabId })
}

export function requestCloseCurrentTab(): Promise<void> {
  return chrome.runtime.sendMessage({ type: 'closeCurrentTab' })
}

export function requestCreateTab(url?: string): Promise<void> {
  return chrome.runtime.sendMessage({ type: 'createTab', url })
}

export function requestListBookmarks(): Promise<BookmarkSummary[]> {
  return chrome.runtime.sendMessage({ type: 'listBookmarks' })
}
