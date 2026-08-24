import { type Memo, parseMemos } from './memo.core'

const storageKey = 'memoState'

export async function loadMemos(): Promise<Memo[]> {
  const stored = await chrome.storage.local.get(storageKey)
  return parseMemos(stored[storageKey])
}

export async function saveMemos(memos: Memo[]): Promise<void> {
  await chrome.storage.local.set({ [storageKey]: { memos } })
}

export function subscribeMemos(listener: (memos: Memo[]) => void): () => void {
  function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: string): void {
    if (area !== 'local') return
    const change = changes[storageKey]
    if (!change) return
    listener(parseMemos(change.newValue))
  }
  chrome.storage.onChanged.addListener(onChanged)
  return () => chrome.storage.onChanged.removeListener(onChanged)
}
