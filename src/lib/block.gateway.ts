import { activeBlockedDomains, matchesDomain } from './block.core'
import { loadBlockState, saveBlockState } from './block.storage'

const unlockDurationMs = 60 * 60 * 1000

export const reblockAlarmPrefix = 'reblock:'

export function blockedPageUrl(domain: string): string {
  return chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(domain)}`)
}

export async function syncBlockRules(): Promise<void> {
  const state = await loadBlockState()
  const active = activeBlockedDomains(state, Date.now())
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: active.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: blockedPageUrl(domain) },
      },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ['main_frame'],
      },
    })),
  })
}

function tabHostname(url: string | undefined): string | null {
  if (url === undefined) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export async function findOpenTabs(domain: string): Promise<chrome.tabs.Tab[]> {
  const tabs = await chrome.tabs.query({})
  return tabs.filter((tab) => {
    const hostname = tabHostname(tab.url)
    return hostname !== null && matchesDomain(hostname, domain)
  })
}

export async function redirectOpenTabs(domain: string): Promise<void> {
  const tabs = await findOpenTabs(domain)
  await Promise.all(
    tabs.flatMap((tab) =>
      tab.id === undefined ? [] : [chrome.tabs.update(tab.id, { url: blockedPageUrl(domain) })],
    ),
  )
}

export async function unlockDomain(domain: string): Promise<boolean> {
  const state = await loadBlockState()
  if (!state.domains.includes(domain)) return false
  const expiry = Date.now() + unlockDurationMs
  state.unlocks = { ...state.unlocks, [domain]: expiry }
  await saveBlockState(state)
  await syncBlockRules()
  await chrome.alarms.create(`${reblockAlarmPrefix}${domain}`, { when: expiry })
  return true
}

export async function handleReblock(domain: string): Promise<void> {
  const state = await loadBlockState()
  state.unlocks = Object.fromEntries(
    Object.entries(state.unlocks).filter(([key]) => key !== domain),
  )
  await saveBlockState(state)
  await syncBlockRules()
  await redirectOpenTabs(domain)
}
