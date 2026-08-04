import type { HistorySummary } from '~/lib/history.core'

export async function searchHistory(query: string): Promise<HistorySummary[]> {
  const entries = await chrome.history.search({ text: query, maxResults: 20 })
  return entries.flatMap((entry) =>
    entry.url === undefined
      ? []
      : [
          {
            title: entry.title ?? '',
            url: entry.url,
            visitCount: entry.visitCount ?? 0,
            lastVisitTime: entry.lastVisitTime ?? 0,
          },
        ],
  )
}
