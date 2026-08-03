import { type BlockState, parseBlockState } from './block.core'

const storageKey = 'blockState'

export async function loadBlockState(): Promise<BlockState> {
  const stored = await chrome.storage.local.get(storageKey)
  return parseBlockState(stored[storageKey])
}

export async function saveBlockState(state: BlockState): Promise<void> {
  await chrome.storage.local.set({ [storageKey]: state })
}
