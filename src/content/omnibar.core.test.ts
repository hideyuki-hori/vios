import { describe, expect, it } from 'vitest'
import { buildOmnibarItems, parseOmnibarId, resolveInput } from './omnibar.core'

describe('resolveInput', () => {
  it('スキーム付きはそのままURLとして扱う', () => {
    expect(resolveInput('https://example.com/path')).toEqual({
      kind: 'url',
      url: 'https://example.com/path',
    })
  })

  it('ドット入りの単語はhttpsを補ってURLにする', () => {
    expect(resolveInput('github.com')).toEqual({ kind: 'url', url: 'https://github.com' })
  })

  it('それ以外は検索URLにする', () => {
    expect(resolveInput('rust lifetimes')).toEqual({
      kind: 'search',
      url: 'https://www.google.com/search?q=rust%20lifetimes',
    })
    expect(resolveInput('vios')).toEqual({
      kind: 'search',
      url: 'https://www.google.com/search?q=vios',
    })
  })

  it('前後の空白を無視する', () => {
    expect(resolveInput('  github.com  ')).toEqual({ kind: 'url', url: 'https://github.com' })
  })
})

describe('parseOmnibarId', () => {
  it('id種別を復元する', () => {
    expect(parseOmnibarId('input:')).toEqual({ type: 'input' })
    expect(parseOmnibarId('tab:12')).toEqual({ type: 'tab', tabId: 12 })
    expect(parseOmnibarId('url:https://example.com')).toEqual({
      type: 'url',
      url: 'https://example.com',
    })
  })
})

describe('buildOmnibarItems', () => {
  const tabs = [
    { id: 1, title: 'GitHub - vios', url: 'https://github.com/hideyuki-hori/vios', active: true },
    { id: 2, title: 'YouTube', url: 'https://www.youtube.com', active: false },
  ]
  const bookmarks = [
    { id: 'b1', title: 'GitHub Home', url: 'https://github.com', path: 'dev' },
    { id: 'b2', title: 'MDN', url: 'https://developer.mozilla.org', path: 'dev' },
  ]
  const history = [
    {
      title: 'GitHub - vios',
      url: 'https://github.com/hideyuki-hori/vios',
      visitCount: 5,
      lastVisitTime: 2,
    },
    { title: 'GitHub Issues', url: 'https://github.com/issues', visitCount: 3, lastVisitTime: 1 },
  ]

  it('空クエリでは入力行なしでタブと履歴を並べる', () => {
    const items = buildOmnibarItems({ query: '', tabs, bookmarks, history })
    expect(items[0]?.id).toBe('tab:1')
    expect(items.some((item) => item.id === 'input:')).toBe(false)
    expect(items.some((item) => item.id.startsWith('url:https://github.com/issues'))).toBe(true)
    expect(items.some((item) => item.secondary.startsWith('ブックマーク'))).toBe(false)
  })

  it('クエリありでは入力行が先頭に来て、各ソースが絞り込まれる', () => {
    const items = buildOmnibarItems({ query: 'github', tabs, bookmarks, history })
    expect(items[0]).toEqual({
      id: 'input:',
      primary: '「github」を検索',
      secondary: '',
      searchText: 'github',
    })
    expect(items[1]?.id).toBe('tab:1')
    expect(items.some((item) => item.id === 'url:https://github.com')).toBe(true)
    expect(items.some((item) => item.id === 'tab:2')).toBe(false)
  })

  it('URLらしいクエリの入力行は「開く」になる', () => {
    const items = buildOmnibarItems({ query: 'github.com', tabs: [], bookmarks: [], history: [] })
    expect(items[0]?.primary).toBe('https://github.com を開く')
  })

  it('タブやブックマークと同じURLの履歴は重複排除される', () => {
    const items = buildOmnibarItems({ query: 'github', tabs, bookmarks, history })
    const viosUrls = items.filter((item) => item.id.includes('github.com/hideyuki-hori/vios'))
    expect(viosUrls).toHaveLength(0)
    expect(items.filter((item) => item.id === 'tab:1')).toHaveLength(1)
  })
})
