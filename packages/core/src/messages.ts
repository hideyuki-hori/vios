export type BackgroundRequest =
  | { type: 'listTabs' }
  | { type: 'activateTab'; tabId: number }
  | { type: 'closeTab'; tabId: number }
  | { type: 'closeCurrentTab' }
  | { type: 'createTab'; url?: string }
  | { type: 'listBookmarks' }
