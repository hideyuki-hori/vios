export type TabSummary = {
  id: number
  title: string
  url: string
  active: boolean
}

export type TabRequest =
  | { type: 'listTabs' }
  | { type: 'activateTab'; tabId: number }
  | { type: 'closeTab'; tabId: number }
  | { type: 'closeCurrentTab' }
  | { type: 'createTab'; url?: string }
