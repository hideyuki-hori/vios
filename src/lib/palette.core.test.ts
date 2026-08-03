import { describe, expect, it } from 'vitest'
import { key } from '~/lib/keys.core'
import {
  createPalette,
  filterByQuery,
  type PaletteConfig,
  type PaletteItem,
} from '~/lib/palette.core'

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

type TestCommand = 'closeTab' | 'newTab'

const config: PaletteConfig<TestCommand> = {
  commands: [
    { key: 'x', command: 'closeTab' },
    { key: 'n', command: 'newTab' },
  ],
  emptyMessage: '該当なし',
}

function numberedItems(count: number): PaletteItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id${i + 1}`,
    primary: `entry-${i + 1}`,
    secondary: `https://example.com/${i + 1}`,
    searchText: `entry-${i + 1}`,
  }))
}

function namedItems(): PaletteItem[] {
  return items.map((item, i) => ({
    id: `id${i + 1}`,
    primary: item.title,
    secondary: item.url,
    searchText: text(item),
  }))
}

describe('createPalette', () => {
  it('j/kで選択が移動し、端でクランプされる', () => {
    const palette = createPalette(numberedItems(3), config)
    expect(palette.feed(key('j'))).toEqual({ type: 'viewChanged' })
    palette.feed(key('j'))
    palette.feed(key('j'))
    expect(palette.view().selectedIndex).toBe(2)
    palette.feed(key('k'))
    expect(palette.view().selectedIndex).toBe(1)
  })

  it('複数桁の数字で選択できる', () => {
    const palette = createPalette(numberedItems(12), config)
    palette.feed(key('1'))
    expect(palette.view().selectedIndex).toBe(0)
    palette.feed(key('2'))
    expect(palette.view().selectedIndex).toBe(11)
  })

  it('桁バッファはj/kでリセットされる', () => {
    const palette = createPalette(numberedItems(12), config)
    palette.feed(key('1'))
    palette.feed(key('j'))
    palette.feed(key('2'))
    expect(palette.view().selectedIndex).toBe(1)
  })

  it('範囲外の数字は単独桁として再解釈し、それも無効ならnoneを返す', () => {
    const palette = createPalette(numberedItems(3), config)
    palette.feed(key('2'))
    expect(palette.feed(key('9'))).toEqual({ type: 'none' })
    palette.feed(key('3'))
    expect(palette.view().selectedIndex).toBe(2)
  })

  it('Enterで選択中のidをcommitする', () => {
    const palette = createPalette(numberedItems(5), config, 2)
    expect(palette.feed(key('Enter'))).toEqual({ type: 'commit', id: 'id3', alt: false })
  })

  it('Shift+Enterはaltフラグ付きでcommitする', () => {
    const palette = createPalette(numberedItems(5), config, 2)
    expect(palette.feed({ ...key('Enter'), shift: true })).toEqual({
      type: 'commit',
      id: 'id3',
      alt: true,
    })
  })

  it('設定されたコマンドキーは選択中のidを添えてcommandを返す', () => {
    const palette = createPalette(numberedItems(3), config, 1)
    expect(palette.feed(key('x'))).toEqual({ type: 'command', command: 'closeTab', id: 'id2' })
    expect(palette.feed(key('n'))).toEqual({ type: 'command', command: 'newTab', id: 'id2' })
  })

  it('未設定のキーとEscape/修飾キーの扱い', () => {
    const palette = createPalette(numberedItems(3), config)
    expect(palette.feed(key('z'))).toEqual({ type: 'none' })
    expect(palette.feed({ ...key('j'), meta: true })).toEqual({ type: 'none' })
    expect(palette.feed(key('Escape'))).toEqual({ type: 'dismiss' })
  })

  it('setQueryで絞り込み、選択は先頭に戻り、0件ならemptyMessageが出る', () => {
    const palette = createPalette(namedItems(), config, 2)
    palette.setQuery('github')
    const view = palette.view()
    expect(view.rows).toHaveLength(1)
    expect(view.rows[0]?.primary).toBe('GitHub - vios')
    expect(view.selectedIndex).toBe(0)
    palette.setQuery('zzz')
    expect(palette.view().rows).toHaveLength(0)
    expect(palette.view().emptyMessage).toBe('該当なし')
  })

  it('0件のときはEscapeだけがdismissになる', () => {
    const palette = createPalette(namedItems(), config)
    palette.setQuery('zzz')
    expect(palette.feed(key('j'))).toEqual({ type: 'none' })
    expect(palette.feed(key('x'))).toEqual({ type: 'none' })
    expect(palette.feed(key('Escape'))).toEqual({ type: 'dismiss' })
  })

  it('/で検索モードに入り、viewに反映される', () => {
    const palette = createPalette(namedItems(), config)
    expect(palette.view().searchFocused).toBe(false)
    palette.feed(key('/'))
    expect(palette.view().searchFocused).toBe(true)
  })

  it('検索モードのEnterは1件なら即commit、複数なら検索モードを抜ける', () => {
    const palette = createPalette(namedItems(), config)
    palette.feed(key('/'))
    palette.setQuery('github')
    expect(palette.feed(key('Enter'))).toEqual({ type: 'commit', id: 'id1', alt: false })

    const multi = createPalette(namedItems(), config)
    multi.feed(key('/'))
    expect(multi.feed(key('Enter'))).toEqual({ type: 'viewChanged' })
    expect(multi.view().searchFocused).toBe(false)
  })

  it('検索モードのEscapeはクエリを消して検索モードを抜ける', () => {
    const palette = createPalette(namedItems(), config)
    palette.feed(key('/'))
    palette.setQuery('github')
    palette.feed(key('Escape'))
    const view = palette.view()
    expect(view.query).toBe('')
    expect(view.rows).toHaveLength(3)
    expect(view.searchFocused).toBe(false)
  })

  it('検索モードでは矢印で選択が動き、その他のキーはnone', () => {
    const palette = createPalette(namedItems(), config)
    palette.feed(key('/'))
    palette.feed(key('ArrowDown'))
    expect(palette.view().selectedIndex).toBe(1)
    expect(palette.feed(key('j'))).toEqual({ type: 'none' })
    expect(palette.feed(key('x'))).toEqual({ type: 'none' })
  })

  it('setItemsは選択位置を保ちつつクランプする', () => {
    const palette = createPalette(numberedItems(5), config, 4)
    palette.setItems(numberedItems(3))
    expect(palette.view().selectedIndex).toBe(2)
    expect(palette.view().rows).toHaveLength(3)
  })
})
