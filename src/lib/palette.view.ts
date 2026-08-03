import { toKey } from '~/lib/keys.to-key'
import {
  createPalette,
  type Palette,
  type PaletteConfig,
  type PaletteEvent,
  type PaletteItem,
  type PaletteView,
} from '~/lib/palette.core'
import paletteCss from '~/lib/palette.css'

const searchModeKeys = new Set(['Enter', 'Escape', 'ArrowDown', 'ArrowUp'])

type PaletteCallbacks<Command extends string> = {
  onCommit: (id: string, alt: boolean) => void
  onCommand?: (command: Command, id: string) => void
}

type OpenState<Command extends string> = {
  host: HTMLDivElement
  shadow: ShadowRoot
  input: HTMLInputElement
  listEl: HTMLUListElement
  rows: HTMLLIElement[]
  renderedRows: string
  machine: Palette<Command>
}

export type PaletteUi = {
  isOpen(): boolean
  open(items: PaletteItem[], initialIndex?: number): void
  close(): void
  setItems(items: PaletteItem[]): void
  handleKeydown(event: KeyboardEvent): void
}

export function createPaletteUi<Command extends string>(
  config: PaletteConfig<Command>,
  callbacks: PaletteCallbacks<Command>,
): PaletteUi {
  let state: OpenState<Command> | null = null

  function isOpen(): boolean {
    return state !== null
  }

  function close(): void {
    if (!state) return
    state.host.remove()
    window.removeEventListener('blur', close)
    state = null
  }

  function buildRows(view: PaletteView): void {
    if (!state) return
    state.listEl.textContent = ''
    state.rows = view.rows.map((row) => {
      const item = document.createElement('li')
      item.className = 'row'
      const num = document.createElement('span')
      num.className = 'num'
      num.textContent = row.num
      const texts = document.createElement('div')
      texts.className = 'texts'
      const title = document.createElement('div')
      title.className = 'title'
      title.textContent = row.primary
      const url = document.createElement('div')
      url.className = 'url'
      url.textContent = row.secondary
      texts.append(title, url)
      item.append(num, texts)
      state?.listEl.append(item)
      return item
    })
    if (view.emptyMessage !== null) {
      const empty = document.createElement('li')
      empty.className = 'empty'
      empty.textContent = view.emptyMessage
      state.listEl.append(empty)
    }
  }

  function render(): void {
    if (!state) return
    const view = state.machine.view()
    const signature = JSON.stringify(view.rows)
    if (signature !== state.renderedRows) {
      buildRows(view)
      state.renderedRows = signature
    }
    state.rows.forEach((row, index) => {
      row.classList.toggle('selected', index === view.selectedIndex)
    })
    state.rows[view.selectedIndex]?.scrollIntoView({ block: 'nearest' })
    if (state.input.value !== view.query) state.input.value = view.query
    const focused = state.shadow.activeElement === state.input
    if (view.searchFocused && !focused) state.input.focus()
    if (!view.searchFocused && focused) state.input.blur()
  }

  function dispatch(event: PaletteEvent<Command>): void {
    switch (event.type) {
      case 'viewChanged':
        render()
        return
      case 'commit':
        close()
        callbacks.onCommit(event.id, event.alt)
        return
      case 'command':
        callbacks.onCommand?.(event.command, event.id)
        return
      case 'dismiss':
        close()
        return
      case 'none':
        return
    }
  }

  function open(items: PaletteItem[], initialIndex = 0): void {
    if (state) return
    const machine = createPalette(items, config, initialIndex)
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
      machine.setQuery(input.value)
      render()
    })
    input.addEventListener('focus', () => {
      machine.setSearchFocused(true)
    })
    input.addEventListener('blur', () => {
      machine.setSearchFocused(false)
    })
    const listEl = document.createElement('ul')
    listEl.className = 'list'
    panel.append(input, listEl)
    shadow.append(style, panel)
    document.documentElement.append(host)
    state = { host, shadow, input, listEl, rows: [], renderedRows: '', machine }
    render()
    window.addEventListener('blur', close)
  }

  function setItems(items: PaletteItem[]): void {
    if (!state) return
    state.machine.setItems(items)
    render()
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!state) return
    if (event.isComposing) return
    if (state.machine.view().searchFocused) {
      if (!searchModeKeys.has(event.key)) return
      event.preventDefault()
      event.stopPropagation()
      dispatch(state.machine.feed(toKey(event)))
      return
    }
    event.preventDefault()
    event.stopPropagation()
    dispatch(state.machine.feed(toKey(event)))
  }

  return { isOpen, open, close, setItems, handleKeydown }
}
