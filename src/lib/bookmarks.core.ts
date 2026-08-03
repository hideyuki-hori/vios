import type { PaletteConfig, PaletteItem } from './palette.core'

export type BookmarkSummary = {
  id: string
  title: string
  url: string
  path: string
}

export type BookmarkRequest = { type: 'listBookmarks' }

export type BookmarkNode = {
  id: string
  title: string
  url?: string
  children?: BookmarkNode[]
}

export function flattenBookmarkTree(roots: BookmarkNode[]): BookmarkSummary[] {
  const result: BookmarkSummary[] = []
  function walk(node: BookmarkNode, path: string): void {
    if (node.url !== undefined) {
      result.push({ id: node.id, title: node.title, url: node.url, path })
      return
    }
    const nextPath = node.title === '' ? path : path === '' ? node.title : `${path}/${node.title}`
    for (const child of node.children ?? []) {
      walk(child, nextPath)
    }
  }
  for (const root of roots) {
    walk(root, '')
  }
  return result
}

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
