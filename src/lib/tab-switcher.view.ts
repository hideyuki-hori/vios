import { createPaletteUi } from '~/lib/palette.view'
import {
  activeTabIndex,
  type TabCommand,
  tabPaletteConfig,
  toTabPaletteItems,
} from '~/lib/tab-switcher.core'
import { requestActivateTab, requestCloseTab, requestListTabs } from '~/lib/tabs.client'

const ui = createPaletteUi<TabCommand>(tabPaletteConfig, {
  onCommit(id) {
    void requestActivateTab(Number(id))
  },
  onCommand(_, id) {
    void closeTabAndRefresh(Number(id))
  },
})

async function closeTabAndRefresh(tabId: number): Promise<void> {
  await requestCloseTab(tabId)
  if (!ui.isOpen()) return
  const tabs = await requestListTabs()
  if (tabs.length === 0) {
    ui.close()
    return
  }
  ui.setItems(toTabPaletteItems(tabs))
}

export function isTabSwitcherOpen(): boolean {
  return ui.isOpen()
}

export async function openTabSwitcher(): Promise<void> {
  if (ui.isOpen()) return
  const tabs = await requestListTabs()
  if (tabs.length === 0) return
  ui.open(toTabPaletteItems(tabs), activeTabIndex(tabs))
}

export function handleTabSwitcherKeydown(event: KeyboardEvent): void {
  ui.handleKeydown(event)
}
