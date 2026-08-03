import { type BookmarkSummary, flattenBookmarkTree } from '~/lib/bookmarks.core'

export async function listBookmarks(): Promise<BookmarkSummary[]> {
  return flattenBookmarkTree(await chrome.bookmarks.getTree())
}
