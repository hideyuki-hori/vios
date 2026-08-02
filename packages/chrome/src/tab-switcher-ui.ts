import { createTabSwitcher, filterByQuery, type TabSummary, type TabSwitcher } from '@vios/core'
import {
  requestActivateTab,
  requestCloseTab,
  requestCreateTab,
  requestListTabs,
} from '@vios/platform'
import { toKey } from './keyboard'

const css = `
.panel {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: min(640px, calc(100vw - 32px));
  max-height: min(480px, 70vh);
  display: flex;
  flex-direction: column;
  background: #1e2026;
  color: #e8e8ea;
  border: 1px solid #383b44;
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  font: 13px/1.45 system-ui, sans-serif;
  padding: 6px;
  z-index: 2147483647;
}
.search {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  margin-bottom: 6px;
  background: #16181d;
  color: #e8e8ea;
  border: 1px solid #383b44;
  border-radius: 6px;
  font: inherit;
  outline: none;
}
.search:focus {
  border-color: #4f78d1;
}
.search::placeholder {
  color: #6b7078;
}
.list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
}
.row {
  display: flex;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
}
.row.selected {
  background: #2b3c5e;
}
.num {
  min-width: 2ch;
  text-align: right;
  color: #8b909a;
  font-variant-numeric: tabular-nums;
}
.texts {
  flex: 1;
  min-width: 0;
}
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.url {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #8b909a;
  font-size: 11px;
}
.empty {
  padding: 10px;
  color: #8b909a;
}
`

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

export const isTabSwitcherOpen = (): boolean => state !== null

const closeSwitcher = (): void => {
  if (!state) return
  state.host.remove()
  window.removeEventListener('blur', closeSwitcher)
  state = null
}

const updateSelection = (index: number): void => {
  if (!state) return
  state.rows.forEach((row, i) => {
    row.classList.toggle('selected', i === index)
  })
  state.rows[index]?.scrollIntoView({ block: 'nearest' })
}

const buildRows = (): void => {
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

const applyFilter = (query: string, preferredIndex: number): void => {
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

const mount = (tabs: TabSummary[], selectedIndex: number): void => {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = css
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

export const openTabSwitcher = async (): Promise<void> => {
  if (state) return
  const tabs = await requestListTabs()
  if (tabs.length === 0) return
  const activeIndex = Math.max(
    tabs.findIndex((tab) => tab.active),
    0,
  )
  mount(tabs, activeIndex)
}

const refreshTabs = async (preferredIndex: number): Promise<void> => {
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

const closeTabAndRefresh = async (tabId: number, previousIndex: number): Promise<void> => {
  await requestCloseTab(tabId)
  await refreshTabs(previousIndex)
}

const isSearchFocused = (): boolean => state !== null && state.shadow.activeElement === state.input

const handleSearchModeKey = (event: KeyboardEvent): void => {
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

export const handleTabSwitcherKeydown = (event: KeyboardEvent): void => {
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
