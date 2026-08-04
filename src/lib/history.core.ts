export type HistorySummary = {
  title: string
  url: string
  visitCount: number
  lastVisitTime: number
}

export type HistoryRequest = { type: 'searchHistory'; query: string }
