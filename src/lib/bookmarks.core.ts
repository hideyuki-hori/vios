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
