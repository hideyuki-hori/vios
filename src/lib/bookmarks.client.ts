import type { BookmarkSummary } from '~/lib/bookmarks.core'

export function requestListBookmarks(): Promise<BookmarkSummary[]> {
  return chrome.runtime.sendMessage({ type: 'listBookmarks' })
}
