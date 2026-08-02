import type { Key } from './key'

const alphabet = 'abcdefghijklmnopqrstuvwxyz'

export const generateHintLabels = (count: number): string[] => {
  if (count <= 0) return []
  let length = 1
  while (alphabet.length ** length < count) length += 1
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    let label = ''
    let value = i
    for (let digit = 0; digit < length; digit++) {
      label = alphabet.charAt(value % alphabet.length) + label
      value = Math.floor(value / alphabet.length)
    }
    labels.push(label)
  }
  return labels
}

export type HintEvent =
  | { type: 'match'; index: number }
  | { type: 'filtered'; candidates: number[]; prefix: string }
  | { type: 'dismiss' }
  | { type: 'none' }

export type HintSession = {
  feed: (input: Key) => HintEvent
}

export const createHintSession = (labels: string[]): HintSession => {
  let prefix = ''

  const candidatesFor = (current: string): number[] =>
    labels.flatMap((label, index) => (label.startsWith(current) ? [index] : []))

  const feed = (input: Key): HintEvent => {
    if (input.ctrl || input.alt || input.meta) return { type: 'none' }
    if (input.key === 'Escape') return { type: 'dismiss' }
    if (input.key === 'Backspace') {
      if (prefix === '') return { type: 'none' }
      prefix = prefix.slice(0, -1)
      return { type: 'filtered', candidates: candidatesFor(prefix), prefix }
    }
    const char = input.key.toLowerCase()
    if (!/^[a-z]$/.test(char)) return { type: 'none' }
    const next = prefix + char
    const exact = labels.indexOf(next)
    if (exact !== -1) return { type: 'match', index: exact }
    const candidates = candidatesFor(next)
    if (candidates.length === 0) return { type: 'none' }
    prefix = next
    return { type: 'filtered', candidates, prefix }
  }

  return { feed }
}
