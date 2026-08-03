import type { PaletteConfig, PaletteItem } from '~/lib/palette.core'
import type { TabSummary } from '~/lib/tabs.core'

export type TabCommand = 'closeTab' | 'newTab'

export const tabPaletteConfig: PaletteConfig<TabCommand> = {
  commands: [
    { key: 'x', command: 'closeTab' },
    { key: 'n', command: 'newTab' },
  ],
  emptyMessage: '該当するタブがありません',
}

export function toTabPaletteItems(tabs: TabSummary[]): PaletteItem[] {
  return tabs.map((tab) => ({
    id: String(tab.id),
    primary: tab.title === '' ? tab.url : tab.title,
    secondary: tab.url,
    searchText: `${tab.title} ${tab.url}`,
  }))
}

export function activeTabIndex(tabs: TabSummary[]): number {
  return Math.max(
    tabs.findIndex((tab) => tab.active),
    0,
  )
}
