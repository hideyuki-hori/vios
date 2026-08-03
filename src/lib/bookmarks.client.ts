import type { BookmarkSummary } from './bookmarks.core'

export function requestListBookmarks(): Promise<BookmarkSummary[]> {
  return chrome.runtime.sendMessage({ type: 'listBookmarks' })
}
