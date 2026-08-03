import type { BookmarkSummary } from './bookmarks.core'

export async function listBookmarks(): Promise<BookmarkSummary[]> {
  const roots = await chrome.bookmarks.getTree()
  const result: BookmarkSummary[] = []
  function walk(node: chrome.bookmarks.BookmarkTreeNode, path: string): void {
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
