import type { HistorySummary } from '~/lib/history.core'

export function requestSearchHistory(query: string): Promise<HistorySummary[]> {
  return chrome.runtime.sendMessage({ type: 'searchHistory', query })
}
