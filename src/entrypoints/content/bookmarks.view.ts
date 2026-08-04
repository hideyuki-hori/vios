import type { BookmarkSummary } from '~/lib/bookmarks.core'
import { requestListBookmarks } from './bookmarks.client'
import { bookmarkPaletteConfig, toBookmarkPaletteItems } from './bookmarks.core'
import { createPaletteUi } from './palette.view'
import { requestCreateTab } from './tabs.client'

let byId = new Map<string, BookmarkSummary>()

const ui = createPaletteUi(bookmarkPaletteConfig, {
  onCommit(id, alt) {
    const bookmark = byId.get(id)
    if (bookmark === undefined) return
    if (alt) {
      void requestCreateTab(bookmark.url)
      return
    }
    location.assign(bookmark.url)
  },
})

export function isBookmarkPaletteOpen(): boolean {
  return ui.isOpen()
}

export async function openBookmarkPalette(): Promise<void> {
  if (ui.isOpen()) return
  const bookmarks = await requestListBookmarks()
  if (bookmarks.length === 0) return
  byId = new Map(bookmarks.map((bookmark) => [bookmark.id, bookmark]))
  ui.open(toBookmarkPaletteItems(bookmarks))
}

export function handleBookmarkKeydown(event: KeyboardEvent): void {
  ui.handleKeydown(event)
}
