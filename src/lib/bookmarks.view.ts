import { requestListBookmarks } from './bookmarks.client'
import {
  type BookmarkNavigator,
  type BookmarkSummary,
  createBookmarkNavigator,
} from './bookmarks.core'
import { toKey } from './keys.to-key'
import { filterByQuery } from './palette.core'
import paletteCss from './palette.css'
import { requestCreateTab } from './tabs.client'

type OpenState = {
  host: HTMLDivElement
  shadow: ShadowRoot
  input: HTMLInputElement
  listEl: HTMLUListElement
  rows: HTMLLIElement[]
  all: BookmarkSummary[]
  filtered: BookmarkSummary[]
  navigator: BookmarkNavigator | null
}

let state: OpenState | null = null

export function isBookmarkPaletteOpen(): boolean {
  return state !== null
}

function closePalette(): void {
  if (!state) return
  state.host.remove()
  window.removeEventListener('blur', closePalette)
  state = null
}

function openBookmark(bookmark: BookmarkSummary, newTab: boolean): void {
  if (newTab) {
    void requestCreateTab(bookmark.url)
    return
  }
  location.assign(bookmark.url)
}

function updateSelection(index: number): void {
  if (!state) return
  state.rows.forEach((row, i) => {
    row.classList.toggle('selected', i === index)
  })
  state.rows[index]?.scrollIntoView({ block: 'nearest' })
}

function buildRows(): void {
  if (!state) return
  state.listEl.textContent = ''
  state.rows = state.filtered.map((bookmark, index) => {
    const row = document.createElement('li')
    row.className = 'row'
    const num = document.createElement('span')
    num.className = 'num'
    num.textContent = String(index + 1)
    const texts = document.createElement('div')
    texts.className = 'texts'
    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = bookmark.title === '' ? bookmark.url : bookmark.title
    const url = document.createElement('div')
    url.className = 'url'
    url.textContent = bookmark.path === '' ? bookmark.url : `${bookmark.path} · ${bookmark.url}`
    texts.append(title, url)
    row.append(num, texts)
    state?.listEl.append(row)
    return row
  })
  if (state.filtered.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = '該当するブックマークがありません'
    state.listEl.append(empty)
  }
}

function applyFilter(query: string, preferredIndex: number): void {
  if (!state) return
  state.filtered = filterByQuery(
    state.all,
    query,
    (bookmark) => `${bookmark.title} ${bookmark.url} ${bookmark.path}`,
  )
  buildRows()
  if (state.filtered.length === 0) {
    state.navigator = null
    return
  }
  const initial = Math.min(preferredIndex, state.filtered.length - 1)
  state.navigator = createBookmarkNavigator(state.filtered.length, initial)
  updateSelection(state.navigator.selectedIndex())
}

function mount(bookmarks: BookmarkSummary[]): void {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = paletteCss
  const panel = document.createElement('div')
  panel.className = 'panel'
  const input = document.createElement('input')
  input.className = 'search'
  input.placeholder = '/で検索'
  input.addEventListener('keydown', (event) => {
    event.stopPropagation()
  })
  input.addEventListener('input', () => {
    applyFilter(input.value, 0)
  })
  const listEl = document.createElement('ul')
  listEl.className = 'list'
  panel.append(input, listEl)
  shadow.append(style, panel)
  document.documentElement.append(host)
  state = {
    host,
    shadow,
    input,
    listEl,
    rows: [],
    all: bookmarks,
    filtered: [],
    navigator: null,
  }
  applyFilter('', 0)
  window.addEventListener('blur', closePalette)
}

export async function openBookmarkPalette(): Promise<void> {
  if (state) return
  const bookmarks = await requestListBookmarks()
  if (bookmarks.length === 0) return
  mount(bookmarks)
}

function isSearchFocused(): boolean {
  return state !== null && state.shadow.activeElement === state.input
}

function handleSearchModeKey(event: KeyboardEvent): void {
  if (!state) return
  switch (event.key) {
    case 'Enter': {
      event.preventDefault()
      event.stopPropagation()
      if (state.filtered.length === 0) return
      if (state.filtered.length === 1) {
        const bookmark = state.filtered[0]
        closePalette()
        if (bookmark) openBookmark(bookmark, event.shiftKey)
        return
      }
      state.input.blur()
      return
    }
    case 'Escape': {
      event.preventDefault()
      event.stopPropagation()
      state.input.value = ''
      applyFilter('', 0)
      state.input.blur()
      return
    }
    case 'ArrowDown':
    case 'ArrowUp': {
      event.preventDefault()
      event.stopPropagation()
      if (!state.navigator) return
      const result = state.navigator.feed(toKey(event))
      if (result.type === 'selectionChanged') updateSelection(result.index)
      return
    }
    default:
      return
  }
}

export function handleBookmarkKeydown(event: KeyboardEvent): void {
  if (!state) return
  if (event.isComposing) return
  if (isSearchFocused()) {
    handleSearchModeKey(event)
    return
  }
  event.preventDefault()
  event.stopPropagation()
  if (event.key === '/') {
    state.input.focus()
    return
  }
  if (!state.navigator) {
    if (event.key === 'Escape') closePalette()
    return
  }
  const result = state.navigator.feed(toKey(event))
  switch (result.type) {
    case 'selectionChanged':
      updateSelection(result.index)
      return
    case 'open': {
      const bookmark = state.filtered[result.index]
      closePalette()
      if (bookmark) openBookmark(bookmark, result.newTab)
      return
    }
    case 'dismiss':
      closePalette()
      return
    case 'none':
      return
  }
}
