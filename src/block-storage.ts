import type { BlockState } from '@vios/core'

const storageKey = 'blockState'

function parseBlockState(value: unknown): BlockState {
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

export async function loadBlockState(): Promise<BlockState> {
  const stored = await chrome.storage.local.get(storageKey)
  return parseBlockState(stored[storageKey])
}

export async function saveBlockState(state: BlockState): Promise<void> {
  await chrome.storage.local.set({ [storageKey]: state })
}
