import { describe, expect, it } from 'vitest'
import { filterByQuery } from './filter'

type Item = {
  title: string
  url: string
}

const items: Item[] = [
  { title: 'GitHub - vios', url: 'https://github.com/hideyuki-hori/vios' },
  { title: 'YouTube', url: 'https://www.youtube.com' },
  { title: 'Vim日本語ドキュメント', url: 'https://vim-jp.org/vimdoc-ja' },
]

function text(item: Item): string {
  return `${item.title} ${item.url}`
}

describe('filterByQuery', () => {
  it('空クエリは全件を返す', () => {
    expect(filterByQuery(items, '', text)).toEqual(items)
    expect(filterByQuery(items, '   ', text)).toEqual(items)
  })

  it('大文字小文字を無視して部分一致する', () => {
    expect(filterByQuery(items, 'GITHUB', text)).toEqual([items[0]])
    expect(filterByQuery(items, 'youtube', text)).toEqual([items[1]])
  })

  it('スペース区切りの複数語はAND条件になる', () => {
    expect(filterByQuery(items, 'github vios', text)).toEqual([items[0]])
    expect(filterByQuery(items, 'github youtube', text)).toEqual([])
  })

  it('URLにもマッチする', () => {
    expect(filterByQuery(items, 'vim-jp', text)).toEqual([items[2]])
  })

  it('日本語でもマッチする', () => {
    expect(filterByQuery(items, '日本語', text)).toEqual([items[2]])
  })

  it('マッチしなければ空配列を返す', () => {
    expect(filterByQuery(items, 'zzz', text)).toEqual([])
  })
})
