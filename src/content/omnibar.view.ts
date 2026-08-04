import type { BookmarkSummary } from '~/lib/bookmarks.core'
import type { TabSummary } from '~/lib/tabs.core'
import { requestListBookmarks } from './bookmarks.client'
import { requestSearchHistory } from './history.client'
import { buildOmnibarItems, parseOmnibarId, resolveInput } from './omnibar.core'
import { createPaletteUi } from './palette.view'
import { requestActivateTab, requestCreateTab, requestListTabs } from './tabs.client'

let cachedTabs: TabSummary[] = []
let cachedBookmarks: BookmarkSummary[] = []
let lastQuery = ''
let requestToken = 0

function openUrl(url: string, newTab: boolean): void {
  if (newTab) {
    void requestCreateTab(url)
    return
  }
  location.assign(url)
}

const ui = createPaletteUi<never>(
  { commands: [], emptyMessage: '候補がありません', searchPrimary: true },
  {
    onCommit(id, alt) {
      const target = parseOmnibarId(id)
      switch (target.type) {
        case 'input':
          openUrl(resolveInput(lastQuery).url, alt)
          return
        case 'tab':
          void requestActivateTab(target.tabId)
          return
        case 'url':
          openUrl(target.url, alt)
          return
      }
    },
    onQueryChange(query) {
      void refresh(query)
    },
  },
)

async function refresh(query: string): Promise<void> {
  lastQuery = query
  const token = ++requestToken
  const history = await requestSearchHistory(query.trim())
  if (token !== requestToken || !ui.isOpen()) return
  ui.setItems(buildOmnibarItems({ query, tabs: cachedTabs, bookmarks: cachedBookmarks, history }))
}

export function isOmnibarOpen(): boolean {
  return ui.isOpen()
}

export async function openOmnibar(): Promise<void> {
  if (ui.isOpen()) return
  const [tabs, bookmarks, history] = await Promise.all([
    requestListTabs(),
    requestListBookmarks(),
    requestSearchHistory(''),
  ])
  cachedTabs = tabs
  cachedBookmarks = bookmarks
  lastQuery = ''
  requestToken += 1
  ui.open(buildOmnibarItems({ query: '', tabs, bookmarks, history }))
}

export function handleOmnibarKeydown(event: KeyboardEvent): void {
  ui.handleKeydown(event)
}
