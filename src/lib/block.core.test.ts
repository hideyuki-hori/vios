import { describe, expect, it } from 'vitest'
import {
  activeBlockedDomains,
  isUnlockCommand,
  isUnlocked,
  matchesDomain,
  normalizeDomain,
} from './block.core'

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
