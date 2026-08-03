import { describe, expect, it } from 'vitest'
import { activeTabIndex, toTabPaletteItems } from '~/lib/tab-switcher.core'

describe('toTabPaletteItems', () => {
  it('タブをPaletteItemに整形し、タイトルが空ならURLを表示する', () => {
    expect(
      toTabPaletteItems([
        { id: 1, title: 'GitHub', url: 'https://github.com', active: true },
        { id: 2, title: '', url: 'https://example.com', active: false },
      ]),
    ).toEqual([
      {
        id: '1',
        primary: 'GitHub',
        secondary: 'https://github.com',
        searchText: 'GitHub https://github.com',
      },
      {
        id: '2',
        primary: 'https://example.com',
        secondary: 'https://example.com',
        searchText: ' https://example.com',
      },
    ])
  })
})

describe('activeTabIndex', () => {
  it('アクティブなタブの位置を返す', () => {
    const tabs = [
      { id: 1, title: 'a', url: 'https://a.test', active: false },
      { id: 2, title: 'b', url: 'https://b.test', active: true },
    ]
    expect(activeTabIndex(tabs)).toBe(1)
  })

  it('アクティブが見つからなければ0を返す', () => {
    expect(activeTabIndex([{ id: 1, title: 'a', url: 'https://a.test', active: false }])).toBe(0)
  })
})
