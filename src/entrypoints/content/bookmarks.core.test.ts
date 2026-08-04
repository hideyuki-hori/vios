import { describe, expect, it } from 'vitest'
import { toBookmarkPaletteItems } from './bookmarks.core'

describe('toBookmarkPaletteItems', () => {
  it('ブックマークをPaletteItemに整形する', () => {
    expect(
      toBookmarkPaletteItems([
        { id: 'a', title: 'MDN', url: 'https://developer.mozilla.org', path: 'dev/docs' },
        { id: 'b', title: '', url: 'https://example.com', path: '' },
      ]),
    ).toEqual([
      {
        id: 'a',
        primary: 'MDN',
        secondary: 'dev/docs · https://developer.mozilla.org',
        searchText: 'MDN https://developer.mozilla.org dev/docs',
      },
      {
        id: 'b',
        primary: 'https://example.com',
        secondary: 'https://example.com',
        searchText: ' https://example.com ',
      },
    ])
  })
})
