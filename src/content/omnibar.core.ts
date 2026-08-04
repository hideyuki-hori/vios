import type { BookmarkSummary } from '~/lib/bookmarks.core'
import type { HistorySummary } from '~/lib/history.core'
import type { TabSummary } from '~/lib/tabs.core'
import { filterByQuery, type PaletteItem } from './palette.core'

const tabLimit = 5
const bookmarkLimit = 5
const historyLimit = 10

export type OmnibarInput = { kind: 'url'; url: string } | { kind: 'search'; url: string }

export function resolveInput(raw: string): OmnibarInput {
  const query = raw.trim()
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(query)) return { kind: 'url', url: query }
  if (!/\s/.test(query) && query.includes('.')) return { kind: 'url', url: `https://${query}` }
  return { kind: 'search', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }
}

export type OmnibarTarget =
  | { type: 'input' }
  | { type: 'tab'; tabId: number }
  | { type: 'url'; url: string }

export function parseOmnibarId(id: string): OmnibarTarget {
  if (id.startsWith('tab:')) return { type: 'tab', tabId: Number(id.slice(4)) }
  if (id.startsWith('url:')) return { type: 'url', url: id.slice(4) }
  return { type: 'input' }
}

export function buildOmnibarItems(input: {
  query: string
  tabs: TabSummary[]
  bookmarks: BookmarkSummary[]
  history: HistorySummary[]
}): PaletteItem[] {
  const query = input.query.trim()
  const items: PaletteItem[] = []
  const seenUrls = new Set<string>()

  if (query !== '') {
    const resolved = resolveInput(query)
    items.push({
      id: 'input:',
      primary: resolved.kind === 'url' ? `${resolved.url} を開く` : `「${query}」を検索`,
      secondary: '',
      searchText: query,
    })
  }

  const tabs = filterByQuery(input.tabs, query, (tab) => `${tab.title} ${tab.url}`)
  for (const tab of tabs.slice(0, tabLimit)) {
    seenUrls.add(tab.url)
    items.push({
      id: `tab:${tab.id}`,
      primary: tab.title === '' ? tab.url : tab.title,
      secondary: `タブ · ${tab.url}`,
      searchText: `${tab.title} ${tab.url}`,
    })
  }

  if (query !== '') {
    const bookmarks = filterByQuery(
      input.bookmarks,
      query,
      (bookmark) => `${bookmark.title} ${bookmark.url} ${bookmark.path}`,
    )
    for (const bookmark of bookmarks.slice(0, bookmarkLimit)) {
      if (seenUrls.has(bookmark.url)) continue
      seenUrls.add(bookmark.url)
      items.push({
        id: `url:${bookmark.url}`,
        primary: bookmark.title === '' ? bookmark.url : bookmark.title,
        secondary: `ブックマーク · ${bookmark.url}`,
        searchText: `${bookmark.title} ${bookmark.url}`,
      })
    }
  }

  let historyCount = 0
  for (const entry of input.history) {
    if (historyCount >= historyLimit) break
    if (seenUrls.has(entry.url)) continue
    seenUrls.add(entry.url)
    historyCount += 1
    items.push({
      id: `url:${entry.url}`,
      primary: entry.title === '' ? entry.url : entry.title,
      secondary: `履歴 · ${entry.url}`,
      searchText: `${entry.title} ${entry.url}`,
    })
  }

  return items
}
