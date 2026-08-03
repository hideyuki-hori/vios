export type BlockState = {
  domains: string[]
  unlocks: Record<string, number>
}

export function parseBlockState(value: unknown): BlockState {
  if (value === null || typeof value !== 'object') return { domains: [], unlocks: {} }
  const domains =
    'domains' in value && Array.isArray(value.domains)
      ? value.domains.filter((entry) => typeof entry === 'string')
      : []
  const unlocks =
    'unlocks' in value && typeof value.unlocks === 'object' && value.unlocks !== null
      ? Object.fromEntries(
          Object.entries(value.unlocks).filter(([, expiry]) => typeof expiry === 'number'),
        )
      : {}
  return { domains, unlocks }
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

export const unlockDurationMs = 60 * 60 * 1000

function withoutUnlock(unlocks: Record<string, number>, domain: string): Record<string, number> {
  return Object.fromEntries(Object.entries(unlocks).filter(([key]) => key !== domain))
}

export function addBlockedDomain(state: BlockState, domain: string): BlockState {
  return { ...state, domains: [...state.domains, domain] }
}

export function removeBlockedDomain(state: BlockState, domain: string): BlockState {
  return {
    domains: state.domains.filter((entry) => entry !== domain),
    unlocks: withoutUnlock(state.unlocks, domain),
  }
}

export function applyUnlock(
  state: BlockState,
  domain: string,
  now: number,
): { state: BlockState; expiry: number } | null {
  if (!state.domains.includes(domain)) return null
  const expiry = now + unlockDurationMs
  return { state: { ...state, unlocks: { ...state.unlocks, [domain]: expiry } }, expiry }
}

export function clearUnlock(state: BlockState, domain: string): BlockState {
  return { ...state, unlocks: withoutUnlock(state.unlocks, domain) }
}
