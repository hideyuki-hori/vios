import { toKey } from './keys.to-key'
import { filterByQuery } from './palette.core'
import paletteCss from './palette.css'
import { createTabSwitcher, type TabSwitcher } from './tab-switcher.core'
import {
  requestActivateTab,
  requestCloseTab,
  requestCreateTab,
  requestListTabs,
} from './tabs.client'
import type { TabSummary } from './tabs.core'

type OpenState = {
  host: HTMLDivElement
  shadow: ShadowRoot
  input: HTMLInputElement
  listEl: HTMLUListElement
  rows: HTMLLIElement[]
  allTabs: TabSummary[]
  filtered: TabSummary[]
  switcher: TabSwitcher | null
}

let state: OpenState | null = null

export function isTabSwitcherOpen(): boolean {
  return state !== null
}

function closeSwitcher(): void {
  if (!state) return
  state.host.remove()
  window.removeEventListener('blur', closeSwitcher)
  state = null
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
  state.rows = state.filtered.map((tab, index) => {
    const row = document.createElement('li')
    row.className = 'row'
    const num = document.createElement('span')
    num.className = 'num'
    num.textContent = String(index + 1)
    const texts = document.createElement('div')
    texts.className = 'texts'
    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = tab.title === '' ? tab.url : tab.title
    const url = document.createElement('div')
    url.className = 'url'
    url.textContent = tab.url
    texts.append(title, url)
    row.append(num, texts)
    state?.listEl.append(row)
    return row
  })
  if (state.filtered.length === 0) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = '該当するタブがありません'
    state.listEl.append(empty)
  }
}

function applyFilter(query: string, preferredIndex: number): void {
  if (!state) return
  state.filtered = filterByQuery(state.allTabs, query, (tab) => `${tab.title} ${tab.url}`)
  buildRows()
  if (state.filtered.length === 0) {
    state.switcher = null
    return
  }
  const initial = Math.min(preferredIndex, state.filtered.length - 1)
  state.switcher = createTabSwitcher(state.filtered.length, initial)
  updateSelection(state.switcher.selectedIndex())
}

function mount(tabs: TabSummary[], selectedIndex: number): void {
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
    allTabs: tabs,
    filtered: [],
    switcher: null,
  }
  applyFilter('', selectedIndex)
  window.addEventListener('blur', closeSwitcher)
}

export async function openTabSwitcher(): Promise<void> {
  if (state) return
  const tabs = await requestListTabs()
  if (tabs.length === 0) return
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.active),
    0,
  )
  mount(tabs, activeIndex)
}

async function refreshTabs(preferredIndex: number): Promise<void> {
  if (!state) return
  const tabs = await requestListTabs()
  if (!state) return
  if (tabs.length === 0) {
    closeSwitcher()
    return
  }
  state.allTabs = tabs
  applyFilter(state.input.value, preferredIndex)
}

async function closeTabAndRefresh(tabId: number, previousIndex: number): Promise<void> {
  await requestCloseTab(tabId)
  await refreshTabs(previousIndex)
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
        const tab = state.filtered[0]
        closeSwitcher()
        if (tab) void requestActivateTab(tab.id)
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
      if (!state.switcher) return
      const result = state.switcher.feed(toKey(event))
      if (result.type === 'selectionChanged') updateSelection(result.index)
      return
    }
    default:
      return
  }
}

export function handleTabSwitcherKeydown(event: KeyboardEvent): void {
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
  if (!state.switcher) {
    if (event.key === 'Escape') closeSwitcher()
    return
  }
  const result = state.switcher.feed(toKey(event))
  switch (result.type) {
    case 'selectionChanged':
      updateSelection(result.index)
      return
    case 'activate': {
      const tab = state.filtered[result.index]
      closeSwitcher()
      if (tab) void requestActivateTab(tab.id)
      return
    }
    case 'closeTab': {
      const tab = state.filtered[result.index]
      if (tab) void closeTabAndRefresh(tab.id, result.index)
      return
    }
    case 'newTab':
      closeSwitcher()
      void requestCreateTab()
      return
    case 'dismiss':
      closeSwitcher()
      return
    case 'none':
      return
  }
}
