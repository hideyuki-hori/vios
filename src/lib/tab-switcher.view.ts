import { createPaletteUi } from './palette.view'
import {
  activeTabIndex,
  type TabCommand,
  tabPaletteConfig,
  toTabPaletteItems,
} from './tab-switcher.core'
import {
  requestActivateTab,
  requestCloseTab,
  requestCreateTab,
  requestListTabs,
} from './tabs.client'

const ui = createPaletteUi<TabCommand>(tabPaletteConfig, {
  onCommit(id) {
    void requestActivateTab(Number(id))
  },
  onCommand(command, id) {
    if (command === 'newTab') {
      ui.close()
      void requestCreateTab()
      return
    }
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
