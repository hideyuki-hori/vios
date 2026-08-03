import { describe, expect, it } from 'vitest'
import {
  activeBlockedDomains,
  addBlockedDomain,
  applyUnlock,
  buildBlockRules,
  clearUnlock,
  isUnlockCommand,
  isUnlocked,
  matchesDomain,
  normalizeDomain,
  parseBlockState,
  removeBlockedDomain,
  unlockDurationMs,
} from '~/lib/block.core'

describe('normalizeDomain', () => {
  it('素のドメインを受け付ける', () => {
    expect(normalizeDomain('youtube.com')).toBe('youtube.com')
  })

  it('URLからドメインを抽出する', () => {
    expect(normalizeDomain('https://www.youtube.com/watch?v=abc')).toBe('youtube.com')
    expect(normalizeDomain('http://example.com:8080/path')).toBe('example.com')
  })

  it('大文字と前後の空白を正規化する', () => {
    expect(normalizeDomain('  YouTube.COM  ')).toBe('youtube.com')
  })

  it('先頭のwwwを取り除く', () => {
    expect(normalizeDomain('www.youtube.com')).toBe('youtube.com')
  })

  it('ドメインとして不正な入力はnullを返す', () => {
    expect(normalizeDomain('')).toBeNull()
    expect(normalizeDomain('   ')).toBeNull()
    expect(normalizeDomain('localhost')).toBeNull()
    expect(normalizeDomain('not a domain')).toBeNull()
  })
})

describe('matchesDomain', () => {
  it('完全一致とサブドメインにマッチする', () => {
    expect(matchesDomain('youtube.com', 'youtube.com')).toBe(true)
    expect(matchesDomain('www.youtube.com', 'youtube.com')).toBe(true)
    expect(matchesDomain('music.youtube.com', 'youtube.com')).toBe(true)
  })

  it('末尾が似ているだけの別ドメインにはマッチしない', () => {
    expect(matchesDomain('notyoutube.com', 'youtube.com')).toBe(false)
    expect(matchesDomain('youtube.com.example.com', 'youtube.com')).toBe(false)
  })
})

describe('isUnlockCommand', () => {
  it('unlock <domain> の形式だけを受け付ける', () => {
    expect(isUnlockCommand('unlock youtube.com', 'youtube.com')).toBe(true)
    expect(isUnlockCommand('  unlock youtube.com  ', 'youtube.com')).toBe(true)
    expect(isUnlockCommand('unlock youtube', 'youtube.com')).toBe(false)
    expect(isUnlockCommand('youtube.com', 'youtube.com')).toBe(false)
    expect(isUnlockCommand('unlock  youtube.com', 'youtube.com')).toBe(false)
  })
})

describe('isUnlocked', () => {
  it('期限内だけtrueを返す', () => {
    const unlocks = { 'youtube.com': 1000 }
    expect(isUnlocked(unlocks, 'youtube.com', 999)).toBe(true)
    expect(isUnlocked(unlocks, 'youtube.com', 1000)).toBe(false)
    expect(isUnlocked(unlocks, 'twitter.com', 0)).toBe(false)
  })
})

describe('activeBlockedDomains', () => {
  it('解除中のドメインを除外する', () => {
    const state = {
      domains: ['youtube.com', 'twitter.com'],
      unlocks: { 'youtube.com': 1000 },
    }
    expect(activeBlockedDomains(state, 500)).toEqual(['twitter.com'])
    expect(activeBlockedDomains(state, 1500)).toEqual(['youtube.com', 'twitter.com'])
  })
})

describe('parseBlockState', () => {
  it('未保存や壊れた値は空のstateにする', () => {
    expect(parseBlockState(undefined)).toEqual({ domains: [], unlocks: {} })
    expect(parseBlockState(null)).toEqual({ domains: [], unlocks: {} })
    expect(parseBlockState('text')).toEqual({ domains: [], unlocks: {} })
    expect(parseBlockState({})).toEqual({ domains: [], unlocks: {} })
  })

  it('正しい形はそのまま復元する', () => {
    const state = { domains: ['youtube.com'], unlocks: { 'youtube.com': 1000 } }
    expect(parseBlockState(state)).toEqual(state)
  })

  it('型の合わない要素だけを取り除く', () => {
    expect(
      parseBlockState({
        domains: ['youtube.com', 1, null],
        unlocks: { 'youtube.com': 1000, 'twitter.com': 'soon' },
      }),
    ).toEqual({ domains: ['youtube.com'], unlocks: { 'youtube.com': 1000 } })
  })
})

describe('addBlockedDomain', () => {
  it('末尾にドメインを追加する', () => {
    const state = { domains: ['youtube.com'], unlocks: {} }
    expect(addBlockedDomain(state, 'twitter.com')).toEqual({
      domains: ['youtube.com', 'twitter.com'],
      unlocks: {},
    })
  })
})

describe('removeBlockedDomain', () => {
  it('ドメインとそのunlockを取り除き、他は残す', () => {
    const state = {
      domains: ['youtube.com', 'twitter.com'],
      unlocks: { 'youtube.com': 1000, 'twitter.com': 2000 },
    }
    expect(removeBlockedDomain(state, 'youtube.com')).toEqual({
      domains: ['twitter.com'],
      unlocks: { 'twitter.com': 2000 },
    })
  })
})

describe('applyUnlock', () => {
  it('登録済みドメインにnowから1時間の期限を付ける', () => {
    const state = { domains: ['youtube.com'], unlocks: {} }
    expect(applyUnlock(state, 'youtube.com', 500)).toEqual({
      state: { domains: ['youtube.com'], unlocks: { 'youtube.com': 500 + unlockDurationMs } },
      expiry: 500 + unlockDurationMs,
    })
  })

  it('未登録ドメインにはnullを返す', () => {
    expect(applyUnlock({ domains: [], unlocks: {} }, 'youtube.com', 0)).toBeNull()
  })
})

describe('clearUnlock', () => {
  it('指定ドメインのunlockだけを取り除く', () => {
    const state = {
      domains: ['youtube.com', 'twitter.com'],
      unlocks: { 'youtube.com': 1000, 'twitter.com': 2000 },
    }
    expect(clearUnlock(state, 'youtube.com')).toEqual({
      domains: ['youtube.com', 'twitter.com'],
      unlocks: { 'twitter.com': 2000 },
    })
  })
})

describe('buildBlockRules', () => {
  it('ドメインごとに連番idのredirectルールを作る', () => {
    expect(buildBlockRules(['youtube.com', 'twitter.com'], (domain) => `page?d=${domain}`)).toEqual(
      [
        {
          id: 1,
          priority: 1,
          action: { type: 'redirect', redirect: { url: 'page?d=youtube.com' } },
          condition: { urlFilter: '||youtube.com^', resourceTypes: ['main_frame'] },
        },
        {
          id: 2,
          priority: 1,
          action: { type: 'redirect', redirect: { url: 'page?d=twitter.com' } },
          condition: { urlFilter: '||twitter.com^', resourceTypes: ['main_frame'] },
        },
      ],
    )
  })
})
