import { extensionName } from './core'
import { handleReblock, reblockAlarmPrefix, syncBlockRules } from './blocking'
import { listBookmarks } from './bookmarks'
import { startDevReload } from './dev-reload'
import type { BackgroundRequest } from './messages'
import { activateTab, closeTab, createTab, listTabs } from './tabs'

console.log(`[${extensionName}] background loaded`)

async function handleRequest(
  request: BackgroundRequest,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  switch (request.type) {
    case 'listTabs':
      return listTabs(sender.tab?.windowId)
    case 'activateTab':
      await activateTab(request.tabId)
      return undefined
    case 'closeTab':
      await closeTab(request.tabId)
      return undefined
    case 'closeCurrentTab': {
      const tabId = sender.tab?.id
      if (tabId !== undefined) await closeTab(tabId)
      return undefined
    }
    case 'createTab':
      await createTab(request.url)
      return undefined
    case 'listBookmarks':
      return listBookmarks()
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  void handleRequest(request, sender).then(sendResponse)
  return true
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(reblockAlarmPrefix)) {
    void handleReblock(alarm.name.slice(reblockAlarmPrefix.length))
  }
})

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage()
})

void syncBlockRules()

if (__DEV__) {
  void startDevReload()
}
