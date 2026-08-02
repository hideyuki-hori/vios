import type { TabSummary } from '@vios/core'

export const listTabs = async (windowId?: number): Promise<TabSummary[]> => {
  const tabs = await chrome.tabs.query(
    windowId === undefined ? { currentWindow: true } : { windowId },
  )
  return tabs.flatMap((tab) =>
    tab.id === undefined
      ? []
      : [{ id: tab.id, title: tab.title ?? '', url: tab.url ?? '', active: tab.active }],
  )
}

export const activateTab = async (tabId: number): Promise<void> => {
  await chrome.tabs.update(tabId, { active: true })
}

export const closeTab = async (tabId: number): Promise<void> => {
  await chrome.tabs.remove(tabId)
}

export const createTab = async (): Promise<void> => {
  await chrome.tabs.create({})
}
