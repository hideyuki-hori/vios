import type { BookmarkSummary } from '~/lib/bookmarks.core'
import type { PaletteConfig, PaletteItem } from './palette.core'

export const bookmarkPaletteConfig: PaletteConfig<never> = {
  commands: [],
  emptyMessage: '該当するブックマークがありません',
}

export function toBookmarkPaletteItems(bookmarks: BookmarkSummary[]): PaletteItem[] {
  return bookmarks.map((bookmark) => ({
    id: bookmark.id,
    primary: bookmark.title === '' ? bookmark.url : bookmark.title,
    secondary: bookmark.path === '' ? bookmark.url : `${bookmark.path} · ${bookmark.url}`,
    searchText: `${bookmark.title} ${bookmark.url} ${bookmark.path}`,
  }))
}
