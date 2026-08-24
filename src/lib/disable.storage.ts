import { parseDisabledSites } from './disable.core'

const storageKey = 'disabledSites'

export async function loadDisabledSites(): Promise<string[]> {
  const stored = await chrome.storage.local.get(storageKey)
  return parseDisabledSites(stored[storageKey])
}

export async function saveDisabledSites(domains: string[]): Promise<void> {
  await chrome.storage.local.set({ [storageKey]: domains })
}

export function subscribeDisabledSites(listener: (domains: string[]) => void): () => void {
  function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: string): void {
    if (area !== 'local') return
    const change = changes[storageKey]
    if (!change) return
    listener(parseDisabledSites(change.newValue))
  }
  chrome.storage.onChanged.addListener(onChanged)
  return () => chrome.storage.onChanged.removeListener(onChanged)
}
