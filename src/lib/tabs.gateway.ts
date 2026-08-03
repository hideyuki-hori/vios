import type { TabSummary } from './tabs.core'

export async function listTabs(windowId?: number): Promise<TabSummary[]> {
  const tabs = await chrome.tabs.query(
    windowId === undefined ? { currentWindow: true } : { windowId },
  )
  return tabs.flatMap((tab) =>
    tab.id === undefined
      ? []
      : [{ id: tab.id, title: tab.title ?? '', url: tab.url ?? '', active: tab.active }],
  )
}

export async function activateTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true })
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId)
}

export async function createTab(url?: string): Promise<void> {
  await chrome.tabs.create(url === undefined ? {} : { url })
}
