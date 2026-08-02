import { type BackgroundRequest, extensionName } from '@vios/core'
import { activateTab, closeTab, createTab, listBookmarks, listTabs } from '@vios/platform'
import { startDevReload } from './dev-reload'

console.log(`[${extensionName}] background loaded`)

const handleRequest = async (
  request: BackgroundRequest,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> => {
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

if (__DEV__) {
  void startDevReload()
}
