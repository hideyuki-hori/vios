import { describe, expect, it } from 'vitest'
import { flattenBookmarkTree } from '~/lib/bookmarks.core'

describe('flattenBookmarkTree', () => {
  it('フォルダ階層をパスにしてurlノードだけを集める', () => {
    const tree = [
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'ブックマーク バー',
            children: [
              { id: '2', title: 'GitHub', url: 'https://github.com' },
              {
                id: '3',
                title: 'dev',
                children: [{ id: '4', title: 'MDN', url: 'https://developer.mozilla.org' }],
              },
            ],
          },
        ],
      },
    ]
    expect(flattenBookmarkTree(tree)).toEqual([
      { id: '2', title: 'GitHub', url: 'https://github.com', path: 'ブックマーク バー' },
      {
        id: '4',
        title: 'MDN',
        url: 'https://developer.mozilla.org',
        path: 'ブックマーク バー/dev',
      },
    ])
  })

  it('子のないフォルダと空タイトルのルートを無視する', () => {
    expect(flattenBookmarkTree([{ id: '0', title: '', children: [] }])).toEqual([])
  })
})
