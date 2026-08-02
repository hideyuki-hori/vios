export type BlockState = {
  domains: string[]
  unlocks: Record<string, number>
}

export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase()
  if (value === '') return null
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  const slash = value.indexOf('/')
  if (slash !== -1) value = value.slice(0, slash)
  const at = value.lastIndexOf('@')
  if (at !== -1) value = value.slice(at + 1)
  const colon = value.indexOf(':')
  if (colon !== -1) value = value.slice(0, colon)
  value = value.replace(/\.$/, '')
  value = value.replace(/^www\./, '')
  const valid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value)
  return valid ? value : null
}

export function matchesDomain(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase()
  return host === domain || host.endsWith(`.${domain}`)
}

export function isUnlockCommand(input: string, domain: string): boolean {
  return input.trim() === `unlock ${domain}`
}

export function isUnlocked(unlocks: Record<string, number>, domain: string, now: number): boolean {
  const expiry = unlocks[domain]
  return expiry !== undefined && expiry > now
}

export function activeBlockedDomains(state: BlockState, now: number): string[] {
  return state.domains.filter((domain) => !isUnlocked(state.unlocks, domain, now))
}
